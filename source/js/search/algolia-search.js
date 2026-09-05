(function() {
  var roots = new WeakMap();
  function mount(root) {
  root = root || document;
  if (roots.has(root)) return roots.get(root);
  var searchWrappers = Array.from(root.querySelectorAll('.search-wrapper'));
  if (searchWrappers.length === 0) {
    return function () {};
  }

  var client = algoliasearch(window.searchConfig.appId, window.searchConfig.apiKey);
  var index = client.initIndex(window.searchConfig.indexName);
  var active = true;
  var cleanups = [];

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

  function filterResults(hits, filterPath) {
    if (!filterPath || filterPath === '/') return hits;
    var regex = new RegExp(filterPath);
    return hits.filter(hit => regex.test(hit.url));
  }

  function displayResults(ownerDocument, searchWrapper, resultArea, hits) {
    var resultList = ownerDocument.createElement("ul");
    resultList.classList.add("search-result-list", "ui-collection-adapter");
    if (hits.length === 0) {
      searchWrapper.classList.add('noresult');
    } else {
      searchWrapper.classList.remove('noresult');
      hits.forEach(function(hit) {
        var contentSnippet = hit._snippetResult.content.value;
        var title = hit.hierarchy.lvl1 || 'Untitled';
        var item = ownerDocument.createElement("li");
        var titleSpan = ownerDocument.createElement("span");
        titleSpan.className = "search-result-title";
        titleSpan.textContent = title;

        var link = ownerDocument.createElement("a");
        link.className = ctx.ui.classes.interactiveSpotlight;
        link.href = hit.url;

        var content = ownerDocument.createElement("p");
        content.className = "search-result-content";
        content.innerHTML = contentSnippet;

        link.appendChild(content);
        item.appendChild(titleSpan);
        item.appendChild(link);
        resultList.appendChild(item);
      });
    }
    unmountResultCards(resultArea);
    resultArea.replaceChildren(resultList);
    mountResultCards(resultList);
  }

  searchWrappers.forEach(function(searchWrapper) {
    var inputArea = searchWrapper.querySelector('.search-input');
    var resultArea = searchWrapper.querySelector('.search-result');
    if (!inputArea || !resultArea) return;
    var ownerDocument = inputArea.ownerDocument || document;
    var onInput = function() {
      var query = inputArea.value.trim();
      var filterPath = inputArea.getAttribute('data-algolia-filter-path');

      if (query.length <= 0) {
        searchWrapper.setAttribute('searching', 'false');
        unmountResultCards(resultArea);
        resultArea.replaceChildren();
        return;
      }

      searchWrapper.setAttribute('searching', 'true');

      index.search(query, {
        hitsPerPage: window.searchConfig.hitsPerPage,
        attributesToHighlight: ['content'],
        attributesToSnippet: ['content:30'],
        highlightPreTag: '<span class="search-keyword">',
        highlightPostTag: '</span>',
        restrictSearchableAttributes: ['content']
      }).then(function(responses) {
        if (active) displayResults(ownerDocument, searchWrapper, resultArea, filterResults(responses.hits, filterPath));
      });
    };

    var onKeydown = function(e) {
      if (e.key == 'Enter') e.preventDefault();
    };
    inputArea.addEventListener("input", onInput);
    inputArea.addEventListener("keydown", onKeydown);

    var observer = new MutationObserver(function(mutationsList) {
      if (mutationsList.length === 1) {
        if (mutationsList[0].addedNodes.length) {
          searchWrapper.classList.remove('noresult');
        } else if (mutationsList[0].removedNodes.length) {
          searchWrapper.classList.add('noresult');
        }
      }
    });
    observer.observe(resultArea, { childList: true });
    cleanups.push(function() {
      inputArea.removeEventListener("input", onInput);
      inputArea.removeEventListener("keydown", onKeydown);
      observer.disconnect();
      unmountResultCards(resultArea);
    });
  });

  var cleanup = function() {
    active = false;
    cleanups.forEach(function(dispose) { dispose(); });
    roots.delete(root);
  };
  roots.set(root, cleanup);
  return cleanup;
  }
  window.stellarAlgoliaSearch = { mount: mount };
})();
