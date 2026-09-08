var searchCache = null;          // 当前可用的搜索数据（数组）
var searchCacheEntry = null;     // 最近读取/写入的缓存条目 { ts, ttl, data }
var searchCacheKey;
var searchStorage;
var preparedSearchSource = null;
var preparedSearchIndex = [];

function searchIndex() {
  if (preparedSearchSource === searchCache) return preparedSearchIndex;
  preparedSearchSource = searchCache;
  preparedSearchIndex = (searchCache || []).filter(data => typeof data.content === 'string' && data.content.trim() && typeof data.path === 'string').map(data => {
    var title = data.title?.trim() || 'Untitled';
    var lower = data.content.toLowerCase();
    var anchors = Array.isArray(data.anchors) ? data.anchors : [];
    var sections = [];
    for (var i = 0; i <= anchors.length; i++) {
      var offset = i ? anchors[i - 1].offset : 0;
      var end = i === anchors.length ? data.content.length : anchors[i].offset;
      sections.push({ anchor: i ? anchors[i - 1] : null, offset, text: data.content.slice(offset, end), lower: lower.slice(offset, end) });
    }
    return { title, titleLower: title.toLowerCase(), domains: data.domains, url: (data.path.startsWith('//') ? data.path.slice(1) : data.path).replace(/\/?index\.html$/, '/').replace(/\.html$/, '/'), sections };
  });
  return preparedSearchIndex;
}
var searchFetchPromise = null;   // 单飞：同一时刻只允许一个请求

var searchLazyLoad = true;
var searchCacheTtl = 86400;

try {
  var searchCfg = ctx.search && ctx.search.local_search;
  if (searchCfg) {
    searchLazyLoad = searchCfg.lazy_load !== false;
    searchCacheTtl = typeof searchCfg.cache_ttl === 'number' ? Math.max(0, searchCfg.cache_ttl) : 86400;
  }
} catch (e) {}

function getSearchPath() {
  var path = ctx.search.path;
  if (path.startsWith('/')) {
    path = path.substring(1);
  }
  return ctx.root + path;
}

function readSearchCache() {
  try {
    var raw = localStorage.getItem(searchCacheKey);
    if (!raw) return null;
    var entry = JSON.parse(raw);
    if (!entry || typeof entry.ts !== 'number' || !Array.isArray(entry.data)) return null;
    return entry;
  } catch (e) {
    console.warn('搜索缓存读取失败', e);
    return null;
  }
}

function writeSearchCache(data) {
  if (searchCacheTtl <= 0) return;
  try {
    var entry = { ts: Date.now(), ttl: searchCacheTtl, data: data };
    localStorage.setItem(searchCacheKey, JSON.stringify(entry));
    searchCacheEntry = entry;
  } catch (e) {
    console.warn('搜索缓存写入失败', e);
  }
}

function isCacheFresh(entry) {
  return !!(entry && typeof entry.ts === 'number' && entry.ttl > 0 && Date.now() - entry.ts < entry.ttl * 1000);
}

// 从 localStorage 恢复缓存到内存（ttl=0 时不使用历史缓存）
function loadCacheIntoMemory() {
  if (searchCacheTtl <= 0) {
    searchCacheEntry = null;
    return null;
  }
  if (!searchCacheEntry) {
    searchCacheEntry = readSearchCache();
  }
  if (searchCacheEntry && Array.isArray(searchCacheEntry.data)) {
    searchCache = searchCacheEntry.data;
    searchIndex();
  }
  return searchCacheEntry;
}

function clearSearchCache() {
  searchCache = null;
  preparedSearchSource = null;
  preparedSearchIndex = [];
  searchCacheEntry = null;
  searchFetchPromise = null;
  try {
    return searchStorage?.clear(localStorage);
  } catch (e) {
    return { ok: false, partial: false, removed: 0, failed: 1 };
  }
}

// 是否需要发起请求：不缓存 / 无缓存 / 缓存过期
function needsFetch() {
  if (searchCacheTtl <= 0) return true;
  var entry = searchCacheEntry || loadCacheIntoMemory();
  return !isCacheFresh(entry);
}

// 拉取搜索数据（单飞），成功后更新内存与 localStorage
function fetchSearchData(path) {
  if (searchFetchPromise) return searchFetchPromise;
  searchFetchPromise = fetch(path)
    .then(function(res) {
      if (!res.ok) throw new Error('search fetch failed: ' + res.status);
      return res.json();
    })
    .then(function(json) {
      if (!Array.isArray(json)) throw new Error('search data is not an array');
      searchCache = json;
      searchIndex();
      writeSearchCache(json);
      return json;
    })
    .catch(function(err) {
      console.warn('搜索数据加载失败', err);
      throw err;
    })
    .finally(function() {
      searchFetchPromise = null;
    });
  return searchFetchPromise;
}

var searchFunc = function(path, wrapperId, searchId, contentId, root) {
  root = root || document;
  var $input = root.querySelector('#' + searchId);
  if (!$input || $input._searchInitialized === true) return;
  if ($input._searchInitialized === 'pending') return; // 数据加载中，等待完成后初始化
  var ownerDocument = $input.ownerDocument || document;

  function getAllCombinations(keywords) {
    const result = [];
    const maxLen = 3; // 组合最大长度
    for (let i = 0; i < keywords.length; i++) {
      for (let j = i + 1; j <= Math.min(i + maxLen, keywords.length); j++) {
        result.push(keywords.slice(i, j).join(" "));
      }
    }
    return result;
  }

  function escapeRegExp(string) {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }

  // 关键词组合（含原始大小写）：按组合长度降序，用于匹配与跳转高亮
  function buildKeywordPairs(value) {
    const tokens = value.trim().split(/\s+/);
    const combos = getAllCombinations(tokens.map(function(t) { return t.toLowerCase(); }));
    const originalCombos = getAllCombinations(tokens);
    const pairs = combos.map(function(kw, i) {
      return { kw: kw, original: originalCombos[i] };
    });
    return pairs.sort(function(a, b) {
      return b.kw.split(" ").length - a.kw.split(" ").length;
    });
  }

  function getCardHoverApi() {
    if (typeof stellar === 'undefined' || !stellar.cardHover) return null;
    return stellar.cardHover;
  }

  function unmountResultCards(root) {
    var cardHover = getCardHoverApi();
    if (cardHover && typeof cardHover.unmountAll === 'function') {
      cardHover.unmountAll(root);
    }
  }

  function mountResultCards(root) {
    var cardHover = getCardHoverApi();
    if (cardHover && typeof cardHover.mountAll === 'function') {
      cardHover.mountAll(root);
    }
  }

  // 构建单条搜索结果 DOM
  function buildResultElement(dataTitle, sectionName, secText, secFirst, pairs, href) {
    const li = ownerDocument.createElement('li');

    // 文章标题位于链接上方，不参与跳转
    const titleSpan = ownerDocument.createElement('span');
    titleSpan.className = 'search-result-title';
    titleSpan.textContent = dataTitle;
    li.appendChild(titleSpan);

    const a = ownerDocument.createElement('a');
    a.className = ctx.ui.classes.interactiveSpotlight;
    a.href = href;

    if (sectionName) {
      const sectionSpan = ownerDocument.createElement('span');
      sectionSpan.className = 'search-result-section';
      sectionSpan.textContent = sectionName;
      a.appendChild(sectionSpan);
    }

    if (secText && secFirst >= 0) {
      var start = Math.max(0, secFirst - 20);
      var end = Math.min(secText.length, secFirst + 80);
      if (start === 0) end = 100;
      var matchContent = secText.substring(start, end);

      var regS = new RegExp(pairs.map(function(p) { return escapeRegExp(p.kw); }).join("|"), "gi");
      const para = ownerDocument.createElement('p');
      para.className = 'search-result-content';
      var cursor = 0;
      for (var match of matchContent.matchAll(regS)) {
        para.appendChild(ownerDocument.createTextNode(matchContent.slice(cursor, match.index)));
        var highlight = ownerDocument.createElement('span');
        highlight.className = 'search-keyword';
        highlight.textContent = match[0];
        para.appendChild(highlight);
        cursor = match.index + match[0].length;
      }
      para.appendChild(ownerDocument.createTextNode(matchContent.slice(cursor) + '...'));
      a.appendChild(para);
    }

    li.appendChild(a);
    return li;
  }

  function initSearch() {
    if (!$input) return;
    if ($input._searchInitialized === true) return; // 防止重复绑定
    $input._searchInitialized = true;

    var $resultContent = root.querySelector('#' + contentId);
    var $wrapper = root.querySelector('#' + wrapperId);

    var revision = 0;
    var timer;
    var composing = false;
    var disposed = false;
    var onInput = function() {
      var query = ++revision;
      clearTimeout(timer);
      if (composing || disposed) return;
      timer = setTimeout(() => runSearch(query), 120);
    };
    var runSearch = function(query) {
      var rawValue = $input.value.trim();
      unmountResultCards($resultContent);
      $resultContent.innerHTML = '';
      $wrapper.setAttribute('searching', rawValue ? 'true' : 'false');
      if (!rawValue) return;
      var pairs = buildKeywordPairs(rawValue);
      var resultList = [];
      var activeDomain = $input.getAttribute('data-domain') || '';
      var index = searchIndex();
      var cursor = 0;
      var active = () => !disposed && query === revision;
      var batch = function() {
        if (!active()) return;
        var deadline = performance.now() + 8;
        do {
          var data = index[cursor++];
          if (!data) break;
          if (activeDomain && !data.domains?.includes(activeDomain)) continue;
        // 标题命中（仅当无任何章节命中时兜底为页面级结果）
        var titleMatches = 0;
        var titleBestKw = null;
        pairs.forEach(function(p) {
          if (data.titleLower.indexOf(p.kw) >= 0) {
            titleMatches += 1;
            if (titleBestKw == null) titleBestKw = p.original;
          }
        });

        var hasSectionResult = false;

        // 逐章节匹配
        data.sections.forEach(function(section) {
          var secText = section.text;
          if (!secText.trim().length) return;
          var secLower = section.lower;
          var secMatches = 0;
          var secFirst = -1;
          var secBestKw = null;
          pairs.forEach(function(p) {
            var pos = secLower.indexOf(p.kw);
            if (pos < 0) return;
            secMatches += 1;
            if (secFirst < 0 || pos < secFirst) secFirst = pos;
            if (secBestKw == null) secBestKw = p.original;
          });
          if (secMatches === 0) return;

          var href = data.url;
          if (section.anchor) {
            href += '?kw=' + encodeURIComponent(secBestKw) + '#' + encodeURIComponent(section.anchor.id);
          } else {
            href += '?kw=' + encodeURIComponent(secBestKw);
          }
          resultList.push({
            rank: secMatches,
            offset: section.offset,
            args: [data.title, section.anchor ? section.anchor.text : null, secText, secFirst, pairs, href]
          });
          hasSectionResult = true;
        });

        if (titleMatches > 0 && !hasSectionResult) {
          resultList.push({
            rank: titleMatches,
            offset: Number.MAX_SAFE_INTEGER,
            args: [data.title, null, null, -1, pairs, data.url + '?kw=' + encodeURIComponent(titleBestKw)]
          });
        }

        } while (cursor < index.length && performance.now() < deadline);
        if (cursor < index.length) { timer = setTimeout(batch, 0); return; }
        resultList.sort((a, b) => b.rank - a.rank || a.offset - b.offset);
        if (!resultList.length) return;
        var ul = ownerDocument.createElement('ul');
        ul.className = 'search-result-list ui-collection-adapter';
        $resultContent.appendChild(ul);
        var shown = 0;
        var more = ownerDocument.createElement('button');
        more.type = 'button';
        more.className = ctx.ui.classes.interactive;
        more.textContent = ctx.search.more;
        var append = function() {
          if (!active()) return;
          more.disabled = true;
          var limit = Math.min(shown + 50, resultList.length);
          var renderBatch = function() {
            if (!active()) return;
            var deadline = performance.now() + 8;
            var fragment = ownerDocument.createDocumentFragment();
            do { fragment.appendChild(buildResultElement(...resultList[shown++].args)); }
            while (shown < limit && performance.now() < deadline);
            ul.appendChild(fragment);
            mountResultCards(ul);
            if (shown < limit) { timer = setTimeout(renderBatch, 0); return; }
            more.disabled = false;
            if (shown >= resultList.length) more.remove();
          };
          renderBatch();
        };
        more.addEventListener('click', append);
        $resultContent.appendChild(more);
        append();
      };
      batch();
    };
    var compositionStart = function() { composing = true; ++revision; clearTimeout(timer); };
    var compositionEnd = function() { composing = false; onInput(); };

    var onKeydown = function(e) {
      if (e.key == 'Enter') {
        e.preventDefault();
      }
    };
    $input.addEventListener("compositionstart", compositionStart);
    $input.addEventListener("compositionend", compositionEnd);
    $input.addEventListener("input", onInput);
    $input.addEventListener("keydown", onKeydown);
    $input._searchCleanup = function() {
      disposed = true; ++revision; clearTimeout(timer);
      unmountResultCards($resultContent);
      $input.removeEventListener("compositionstart", compositionStart);
      $input.removeEventListener("compositionend", compositionEnd);
      $input.removeEventListener("input", onInput);
      $input.removeEventListener("keydown", onKeydown);
      $input._searchInitialized = undefined;
      $input._searchCleanup = undefined;
    };

    // 同步当前状态：已有文字立即执行一次搜索，否则清除加载态
    if ($input.value && $input.value.trim().length > 0) {
      $input.dispatchEvent(new Event('input'));
    } else {
      $wrapper.setAttribute('searching', 'false');
    }
  }

  // 已有可用数据（新鲜或过期）→ 立即初始化
  if (searchCache) {
    initSearch();
    return;
  }
  // 尝试从 localStorage 恢复
  loadCacheIntoMemory();
  if (searchCache) {
    initSearch();
    return;
  }
  // 无数据：标记等待，拉取完成后初始化
  $input._searchInitialized = 'pending';
  fetchSearchData(path)
    .then(function() {
      if ($input._searchInitialized === 'pending' && searchCache) {
        initSearch();
      }
    })
    .catch(function() {
      if ($input._searchInitialized === 'pending') {
        $input._searchInitialized = undefined; // 允许下次聚焦重试
      }
      var $wrapper = root.querySelector('#' + wrapperId);
      if ($wrapper) $wrapper.setAttribute('searching', 'false');
    });
};

// 聚焦触发：懒加载模式下首次聚焦搜索框才加载数据
var localSearchRoots = new WeakMap();

function mountLocalSearch(root, storage) {
  root = root || document;
  searchStorage = storage;
  searchCacheKey = storage.key(getSearchPath(), document.baseURI);
  if (!searchLazyLoad && needsFetch()) fetchSearchData(getSearchPath()).catch(function() {});
  if (localSearchRoots.has(root)) return localSearchRoots.get(root);
  var wrappers = Array.from(root.querySelectorAll('.search-wrapper'));
  var observers = [];
  var onFocus = function(e) {
    var input = e.target;
    if (!input || !input.classList?.contains('search-input')) return;
    var wrapper = input.closest('.search-wrapper');
    if (!wrapper) return;
    var resultArea = wrapper.querySelector('.search-result');
    if (!resultArea) return;
    var path = getSearchPath();
    if (input._searchInitialized === true) {
      if (needsFetch()) fetchSearchData(path).catch(function() {});
      return;
    }
    if (searchLazyLoad && !searchCache && !loadCacheIntoMemory()) {
      wrapper.setAttribute('searching', 'true');
    }
    searchFunc(path, wrapper.id, input.id, resultArea.id, root);
    if (searchCache && needsFetch()) fetchSearchData(path).catch(function() {});
  };
  root.addEventListener("focusin", onFocus);
  wrappers.forEach(function(wrapper) {
    var resultArea = wrapper.querySelector('.search-result');
    var input = wrapper.querySelector('.search-input');
    if (!resultArea || !input) return;
    var observer = new MutationObserver(function() {
      var hasResults = resultArea.querySelector(".search-result-list li");
      wrapper.classList.toggle('noresult', !hasResults);
    });
    observer.observe(resultArea, { childList: true, subtree: true });
    observers.push(observer);
    if ((!searchLazyLoad || input === document.activeElement || input.value.trim()) && input._searchInitialized !== true) {
      searchFunc(getSearchPath(), wrapper.id, input.id, resultArea.id, root);
    }
  });
  var cleanup = function() {
    root.removeEventListener("focusin", onFocus);
    observers.forEach(function(observer) { observer.disconnect(); });
    wrappers.forEach(function(wrapper) {
      var input = wrapper.querySelector('.search-input');
      if (!input) return;
      input._searchCleanup?.();
      input._searchInitialized = undefined;
    });
    localSearchRoots.delete(root);
  };
  localSearchRoots.set(root, cleanup);
  return cleanup;
}

window.stellarLocalSearch = { mount: mountLocalSearch, clearCache: clearSearchCache };
