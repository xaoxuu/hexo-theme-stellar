export async function mount(root, context) {
  if (root.nodeType !== 9) {
    throw new TypeError('[stellar runtime] legacy data-service adapter requires a document root');
  }
  const assets = context.assets;
  const config = context.extension.config;
  const services = Object.assign({}, config.services, {
    siteinfo: Object.assign({}, config.services.siteinfo, { api: config.siteInfoEndpoint })
  });
  const deps = { marked: config.marked };
  const loads = [];
  const voiceCleanups = [];
  // 用于存储需要清理的资源
  let intervals = [];
  let timeouts = [];

  for (let id of Object.keys(services)) {
    const js = services[id].js;
    if (id == 'siteinfo') {
      const cardlinks = root.querySelectorAll('a.link-card[cardlink]');
      const siteCards = root.querySelectorAll('.ds-sites, .site-card .card-link[data-siteinfo-api]');
      if (cardlinks?.length > 0 || siteCards?.length > 0) {
        loads.push(assets.script(js).then(function () {
          if (cardlinks?.length > 0) {
            setCardLink(cardlinks);
          }
        }));
      }
    } else if (id == 'ghinfo') {
      const els = root.querySelectorAll('.ds-ghinfo');
      if (els.length > 0) {
        loads.push(assets.script(js));
      }
    } else if (id == 'voice') {
      const voiceAudios = root.querySelectorAll('.voice>audio');
      if (voiceAudios?.length > 0) {
        loads.push(assets.script(js).then(function () {
          const voiceCleanup = createVoiceDom(voiceAudios);
          if (typeof voiceCleanup === 'function') voiceCleanups.push(voiceCleanup);
        }));
      }
    } else if (id == 'video') {
      const videos = root.querySelectorAll('.video>video');
      if (videos?.length > 0) {
        loads.push(assets.script(js).then(function () {
          videoEvents(videos);
        }));
      }
    } else if (id == 'download-file') {
      const files = root.querySelectorAll('.chat-file');
      if (files?.length > 0) {
        loads.push(assets.script(js).then(function () {
          downloadFileEvent(files);
        }));
      }
    } else {
      const els = root.getElementsByClassName(`ds-${id}`);
      if (els?.length > 0) {
        if (id == 'timeline' || id == 'memos' || id == 'marked' || id == 'mdrender') {
          loads.push(assets.script(deps.marked).then(function () {
            return assets.script(js);
          }));
        } else {
          loads.push(assets.script(js));
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
      var candidate = root.getElementById("quote-" + quote.getAttribute("quotedCellTag"));
      var chatCellDom = candidate && root.documentElement.contains(candidate) ? candidate : null;
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
  try {
    await Promise.all(loads);
  } catch (error) {
    cleanup();
    throw error;
  }
  return cleanup;
}
