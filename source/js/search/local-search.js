var searchCache = null;
var searchCacheKey = 'search_cache_v1';

var searchFunc = function(path, filter, wrapperId, searchId, contentId) {
  var $input = document.getElementById(searchId);
  if (!$input || $input._searchInitialized === true) return;
  if ($input._searchInitialized === 'pending' && !searchCache) return;

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

  function initSearch(datas) {
    if (!$input) { return; }
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

      datas.forEach(function(data) {
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
  }

  if (!searchCache) {
    $input._searchInitialized = 'pending';
    // 数据还没准备好，延迟初始化
    const timer = setInterval(() => {
      if (searchCache) {
        clearInterval(timer);
        initSearch(searchCache);
      }
    }, 100);
  } else {
    initSearch(searchCache);
  }
};

utils.jq(() => {
  (function preloadSearchData() {
    var path = ctx.search.path;
    if (path.startsWith('/')) {
      path = path.substring(1);
    }
    path = ctx.root + path;

    try {
      var cached = localStorage.getItem(searchCacheKey);
      if (cached) {
        searchCache = JSON.parse(cached);
      }
    } catch (e) {
      console.warn('搜索缓存解析失败', e);
    }

    fetch(path)
      .then(res => res.json())
      .then(json => {
        searchCache = json;
        try {
          localStorage.setItem(searchCacheKey, JSON.stringify(json));
        } catch (e) {
          console.warn('搜索缓存写入失败', e);
        }
      });
  })();

  var $inputArea = $("input#search-input");
  if ($inputArea.length == 0) return;
  var $resultArea = document.querySelector("div#search-result");

  $inputArea.focus(function() {
    var path = ctx.search.path;
    if (path.startsWith('/')) {
      path = path.substring(1);
    }
    path = ctx.root + path;
    const filter = $inputArea.attr('data-filter') || '';
    searchFunc(path, filter, 'search-wrapper', 'search-input', 'search-result');
  });

  $inputArea.keydown(function(e) {
    if (e.which == 13) {
      e.preventDefault();
    }
  });

  const observer = new MutationObserver(function(mutationsList) {
    const hasResults = $resultArea.querySelector(".search-result-list li");
    $('.search-wrapper').toggleClass('noresult', !hasResults);
  });
  observer.observe($resultArea, { childList: true, subtree: true });
});