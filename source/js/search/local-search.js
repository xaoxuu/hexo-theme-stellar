var searchCache = null;          // 当前可用的搜索数据（数组）
var searchCacheEntry = null;     // 最近读取/写入的缓存条目 { ts, ttl, data }
var searchCacheKey = 'search_cache_v2';
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
  }
  return searchCacheEntry;
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

var searchFunc = function(path, filter, wrapperId, searchId, contentId) {
  var $input = document.getElementById(searchId);
  if (!$input || $input._searchInitialized === true) return;
  if ($input._searchInitialized === 'pending') return; // 数据加载中，等待完成后初始化

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

  function initSearch() {
    if (!$input) return;
    if ($input._searchInitialized === true) return; // 防止重复绑定
    $input._searchInitialized = true;

    var $resultContent = document.getElementById(contentId);
    var $wrapper = document.getElementById(wrapperId);

    $input.addEventListener("input", function() {
      var resultList = [];
      var keywords = getAllCombinations(this.value.trim().toLowerCase().split(" "))
        .sort(function(a,b) { return b.split(" ").length - a.split(" ").length; });
      $resultContent.innerHTML = "";
      if (this.value.trim().length <= 0) {
        $wrapper.setAttribute('searching', 'false');
        return;
      }
      $wrapper.setAttribute('searching', 'true');

      // 读取模块级 searchCache：后台刷新后即时生效
      (searchCache || []).forEach(function(data) {
        if (!data.content?.trim().length) return;
        if (filter && !data.path.includes(filter)) return;

        var matches = 0;
        var dataTitle = data.title?.trim() || 'Untitled';
        var dataTitleLowerCase = dataTitle.toLowerCase();
        var dataContent = data.content;
        var dataContentLowerCase = dataContent.toLowerCase();
        var dataUrl = data.path.startsWith('//') ? data.path.slice(1) : data.path;
        dataUrl = dataUrl.replace(/\/?index\.html$/, '/'); // index.html → /
        dataUrl = dataUrl.replace(/\.html$/, '/'); // xxx.html → xxx/

        var indexTitle = -1;
        var indexContent = -1;
        var firstOccur = -1;

        keywords.forEach(function(keyword) {
          indexTitle = dataTitleLowerCase.indexOf(keyword);
          indexContent = dataContentLowerCase.indexOf(keyword);
          if (indexTitle >= 0 || indexContent >= 0) {
            matches += 1;
            if (indexContent < 0) indexContent = 0;
            if (firstOccur < 0) firstOccur = indexContent;
          }
        });

        if (matches > 0) {
          const li = document.createElement('li');
          const a = document.createElement('a');
          a.href = dataUrl;

          const titleSpan = document.createElement('span');
          titleSpan.className = 'search-result-title';
          titleSpan.textContent = dataTitle;
          a.appendChild(titleSpan);

          if (firstOccur >= 0) {
            var start = Math.max(0, firstOccur - 20);
            var end = Math.min(dataContent.length, firstOccur + 80);
            if (start === 0) end = 100;
            var matchContent = dataContent.substring(start, end);

            var regS = new RegExp(keywords.map(escapeRegExp).join("|"), "gi");
            matchContent = matchContent.replace(regS, function(keyword) {
              return "<span class=\"search-keyword\">" + keyword + "</span>";
            });

            const para = document.createElement('p');
            para.className = 'search-result-content';
            para.innerHTML = matchContent + '...';
            a.appendChild(para);
          }

          li.appendChild(a);
          resultList.push({ rank: matches, element: li });
        }
      });

      if (resultList.length) {
        resultList.sort(function(a, b) {
          return b.rank - a.rank;
        });

        const ul = document.createElement('ul');
        ul.className = 'search-result-list';
        resultList.forEach(function(item) {
          ul.appendChild(item.element);
        });

        $resultContent.innerHTML = '';
        $resultContent.appendChild(ul);
      }
    });

    $input.addEventListener("keydown", function(e) {
      if (e.key == 'Enter') {
        e.preventDefault();
      }
    });

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
      var $wrapper = document.getElementById(wrapperId);
      if ($wrapper) $wrapper.setAttribute('searching', 'false');
    });
};

// 页面加载预取：仅非懒加载模式（缓存新鲜时不重复请求）
(function preloadSearchData() {
  if (searchLazyLoad) return;
  if (needsFetch()) {
    fetchSearchData(getSearchPath()).catch(function() {});
  }
})();

// 聚焦触发：懒加载模式下首次聚焦搜索框才加载数据
document.addEventListener("focusin", function(e) {
  var input = e.target;
  if (!input || input.id !== 'search-input') return;
  var path = getSearchPath();
  var filter = input.getAttribute('data-filter') || '';

  // 已初始化：仅按需后台刷新（刷新失败下次聚焦自动重试）
  if (input._searchInitialized === true) {
    if (needsFetch()) {
      fetchSearchData(path).catch(function() {});
    }
    return;
  }

  // 懒加载：无可用数据时显示加载态（复用 searching 绿色图标状态）
  if (searchLazyLoad && !searchCache && !loadCacheIntoMemory()) {
    var $wrapper = document.getElementById('search-wrapper');
    if ($wrapper) $wrapper.setAttribute('searching', 'true');
  }

  searchFunc(path, filter, 'search-wrapper', 'search-input', 'search-result');

  // 有数据但已过期（或 ttl=0）→ 后台刷新
  if (searchCache && needsFetch()) {
    fetchSearchData(path).catch(function() {});
  }
});

// 无结果/有结果状态兜底
(function() {
  var resultArea = document.querySelector("div#search-result");
  if (!resultArea) return;

  var observer = new MutationObserver(function(mutationsList) {
    var hasResults = resultArea.querySelector(".search-result-list li");
    var wrapper = document.querySelector('.search-wrapper');
    if (wrapper) wrapper.classList.toggle('noresult', !hasResults);
  });
  observer.observe(resultArea, { childList: true, subtree: true });
})();
