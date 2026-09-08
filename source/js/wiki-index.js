// Wiki 覆盖层须同时等待封面原图和平均主题色完成，避免默认主题色短暂闪现。
  function revealWikiCover(card) {
    if (card._wikiImageReady && card._wikiOverlayReady && !card.classList.contains('no-cover')) {
      card.classList.add('cover-loaded');
    }
  }
  document.addEventListener('wiki-overlay-ready', function(event) {
    var card = event.target.closest('.wiki-card');
    if (!card) return;
    card._wikiOverlayReady = true;
    revealWikiCover(card);
  });
  document.querySelectorAll('.wiki-card-cover:not(.no-cover) > img').forEach(function(img) {
    var cover = img.parentElement;
    var card = img.closest('.wiki-card');
    if (!cover || !card) return;
    var loaded = function() {
      card._wikiImageReady = true;
      revealWikiCover(card);
    };
    var failed = function() {
      card._wikiImageReady = false;
      card.classList.remove('cover-loaded');
      card.classList.add('no-cover');
      cover.classList.add('no-cover', 'cover-error');
    };
    img.addEventListener('load', loaded, { once: true });
    img.addEventListener('error', failed, { once: true });
    if (img.complete) {
      if (img.naturalWidth > 0) {
        loaded();
      } else {
        failed();
      }
    }
  });
