/* global setMdLinkIcon */
export async function mount(root, context) {
  const assets = context.assets;
  const config = context.extension.config;
  const services = context.legacy.ctx.services;
  const deps = { marked: config.marked };
  const loads = [];
  const onSitesReady = event => {
    const element = event.detail?.target;
    if (element && root.contains(element) && !context.signal.aborted) {
      void assets.script(services.siteinfo.js).then(() => {
        if (!context.signal.aborted) window.setSiteCardIcon?.(element.querySelectorAll('.card-link[data-siteinfo-api]'), context.signal);
      }).catch(error => { if (!context.signal.aborted) context.reportError(error); });
    }
  };
  window.addEventListener('stellar:sites-ready', onSitesReady, { signal: context.signal });

  const onMarkdownRendered = event => {
    if (context.signal.aborted) return;
    const mdlinks = [];
    for (const link of event.detail?.links || []) {
      if (!root.contains(link)) continue;
      const href = link.getAttribute('href')?.trim();
      if (!href || href.startsWith('#') || link.getAttribute('class') || link.getAttribute('role') ||
          link.matches('[cardlink], [data-md-link], [data-siteinfo-api]') ||
          link.closest('pre, code, .highlight, .footnotes') ||
          link.querySelector('img, svg') || !link.textContent.trim()) continue;
      let url;
      try { url = new URL(href, link.baseURI); } catch { continue; }
      if (!['http:', 'https:'].includes(url.protocol)) continue;
      link.setAttribute('data-md-link', '');
      const icon = document.createElement('span');
      icon.className = 'md-link-icon ui-icon';
      icon.setAttribute('aria-hidden', 'true');
      icon.innerHTML = context.legacy.ctx.icons['default:link'];
      link.prepend(icon);
      if (services.siteinfo.api) {
        link.setAttribute('data-siteinfo-api', services.siteinfo.api.replace('{href}', encodeURIComponent(url.href)));
        mdlinks.push(link);
      }
    }
    if (mdlinks.length) {
      void assets.script(services.siteinfo.js).then(() => {
        if (!context.signal.aborted) setMdLinkIcon(mdlinks, context.signal);
      }).catch(error => { if (!context.signal.aborted) context.reportError(error); });
    }
  };
  document.addEventListener('stellar:mdrender', onMarkdownRendered, { signal: context.signal });

  const voiceCleanups = [];
  const baseUtils = window.utils;
  const serviceUtils = Object.create(baseUtils);
  serviceUtils.request = (element, url, callback, failure, options = {}) => baseUtils.request(element, url, async response => {
    context.signal.throwIfAborted();
    const guarded = new Proxy(response, { get(target, key) {
      if (key === 'json' || key === 'text') return async () => {
        const data = await target[key]();
        context.signal.throwIfAborted();
        return data;
      };
      const value = Reflect.get(target, key, target);
      return typeof value === 'function' ? value.bind(target) : value;
    } });
    await callback(guarded);
  }, failure, { ...options, signal: context.signal }).catch(error => {
    if (!context.signal.aborted) context.reportError(error);
  });
  serviceUtils.requestWithoutLoading = (url, options = {}) => baseUtils.requestWithoutLoading(url, { ...options, signal: context.signal });
  function loadService(js) {
    return assets.script(js).then(script => {
      context.signal.throwIfAborted();
      if (typeof script.stellarMount !== 'function') throw new TypeError(`data-service asset has no regional mount: ${js}`);
      return script.stellarMount(root, { ...context, serviceUtils });
    });
  }

  // 用于存储需要清理的资源
  let intervals = [];
  let timeouts = [];

  for (let id of Object.keys(services)) {
    const js = services[id].js;
    if (id == 'siteinfo') {
      const cardlinks = root.querySelectorAll('a.link-card[cardlink]');
      const mdlinks = root.querySelectorAll('a[data-md-link][data-siteinfo-api]');
      const siteCards = root.querySelectorAll('.ds-sites, .site-card .card-link[data-siteinfo-api]');
      if (cardlinks?.length > 0 || siteCards?.length > 0 || mdlinks.length > 0) {
        loads.push(assets.script(js).then(function () {
          context.signal?.throwIfAborted();
          setMdLinkIcon(mdlinks, context.signal);
          window.setSiteCardIcon?.(root.querySelectorAll('.site-card .card-link[data-siteinfo-api]'), context.signal);
          if (cardlinks?.length > 0) {
            setCardLink(cardlinks, context.signal);
          }
        }));
      }
    } else if (id == 'ghinfo') {
      const els = root.querySelectorAll('.ds-ghinfo');
      if (els.length > 0) {
        loads.push(loadService(js));
      }
    } else if (id == 'voice') {
      const voiceAudios = root.querySelectorAll('.voice>audio');
      if (voiceAudios?.length > 0) {
        loads.push(assets.script(js).then(function () {
          context.signal?.throwIfAborted();
          const voiceCleanup = createVoiceDom(voiceAudios);
          if (typeof voiceCleanup === 'function') voiceCleanups.push(voiceCleanup);
        }));
      }
    } else if (id == 'video') {
      const videos = root.querySelectorAll('.video>video');
      if (videos?.length > 0) {
        loads.push(assets.script(js).then(function () {
          context.signal?.throwIfAborted();
          voiceCleanups.push(videoEvents(videos));
        }));
      }
    } else if (id == 'download-file') {
      const files = root.querySelectorAll('.chat-file');
      if (files?.length > 0) {
        loads.push(assets.script(js).then(function () {
          context.signal?.throwIfAborted();
          voiceCleanups.push(downloadFileEvent(files));
        }));
      }
    } else {
      const els = root.getElementsByClassName(`ds-${id}`);
      if (els?.length > 0) {
        if (id == 'timeline' || id == 'memos' || id == 'marked' || id == 'mdrender') {
          loads.push(assets.script(deps.marked).then(function () {
          context.signal?.throwIfAborted();
            return loadService(js);
          }));
        } else {
          loads.push(loadService(js));
        }
      }
    }
  }

  // chat iphone time
  let phoneTimes = root.querySelectorAll('.chat .status-bar .time');
  let firstAdjustInterval = null;
  let mainInterval = null;

  if (phoneTimes.length > 0) {
    NowTime();
    const date = new Date();
    const sec = date.getSeconds();
    firstAdjustInterval = setInterval(firstAdjustTime, 1000 * (60 - sec));
    intervals.push(firstAdjustInterval);

    function firstAdjustTime() {
      NowTime();
      if (firstAdjustInterval) {
        clearInterval(firstAdjustInterval);
        firstAdjustInterval = null;
      }
      mainInterval = setInterval(NowTime, 1000 * 60);
      intervals.push(mainInterval);
    }

    function NowTime() {
      for (let i = 0; i < phoneTimes.length; ++i) {
        const timeSpan = phoneTimes[i];
        const date = new Date();
        const hour = date.getHours();
        const min = date.getMinutes();
        timeSpan.innerHTML = check(hour) + ":" + check(min);
      }
    };

    function check(val) {
      if (val < 10) {
        return ("0" + val);
      }
      return (val);
    }
  }

  // chat quote - 存储事件监听器以便清理
  const quoteClickHandlers = new Map();
  const chat_quote_obverser = new IntersectionObserver((entries, observer) => {
    entries.filter((entry) => { return entry.isIntersecting }).sort((a, b) => a.intersectionRect.y !== b.intersectionRect.y ? a.intersectionRect.y - b.intersectionRect.y : a.intersectionRect.x - b.intersectionRect.x).forEach((entry, index) => {
        observer.unobserve(entry.target);
        const blinkStart = setTimeout(() => {
          entry.target.classList.add('quote-blink');
          const blinkEnd = setTimeout(() => {
            entry.target.classList.remove('quote-blink');
          }, 1000);
          timeouts.push(blinkEnd);
        }, Math.max(100, 16) * (index + 1));
        timeouts.push(blinkStart);
      });
  });

  var chatQuotes = root.querySelectorAll(".chat .talk .quote");
  chatQuotes.forEach((quote) => {
    const handler = function () {
      var candidate = (root.ownerDocument || root).getElementById("quote-" + quote.getAttribute("quotedCellTag"));
      var chatCellDom = candidate && (root.documentElement || root).contains(candidate) ? candidate : null;
      if (chatCellDom) {
        var chatDiv = chatCellDom.parentElement;
        var mid = chatDiv.clientHeight / 2;
        var offsetTop = chatCellDom.offsetTop;
        if (offsetTop > mid - chatCellDom.clientHeight / 2) {
          chatDiv.scrollTo({
            top: chatCellDom.offsetTop - mid + chatCellDom.clientHeight / 2,
            behavior: "smooth"
          });
        } else {
          chatDiv.scrollTo({
            top: 0,
            behavior: "smooth"
          });
        }
        chat_quote_obverser.observe(chatCellDom);
      }
    };
    quote.addEventListener('click', handler);
    quoteClickHandlers.set(quote, handler); // 保存处理器引用
  });

  // 返回清理函数，用于清理定时器和观察器
  const cleanup = () => {
    // 清理所有定时器（包括可能未完成的 firstAdjustInterval）
    intervals.forEach(timer => {
      if (timer) clearInterval(timer);
    });
    intervals = [];
    timeouts.forEach(timer => {
      if (timer) clearTimeout(timer);
    });
    timeouts = [];
    if (firstAdjustInterval) {
      clearInterval(firstAdjustInterval);
      firstAdjustInterval = null;
    }
    if (mainInterval) {
      clearInterval(mainInterval);
      mainInterval = null;
    }

    // 断开观察器
    if (chat_quote_obverser) {
      chat_quote_obverser.disconnect();
    }

    // 移除所有 click 事件监听器
    quoteClickHandlers.forEach((handler, quote) => {
      quote.removeEventListener('click', handler);
    });
    quoteClickHandlers.clear();
    for (let index = voiceCleanups.length - 1; index >= 0; index -= 1) {
      voiceCleanups[index]();
    }
    voiceCleanups.length = 0;
  };
  context.onCleanup?.(cleanup);
  try {
    await Promise.allSettled(loads.map(promise => promise.catch(error => { context.reportError(error); })));
  } catch (error) {
    cleanup();
    throw error;
  }
  return cleanup;
}
