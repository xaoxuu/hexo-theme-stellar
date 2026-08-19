// utils
const util = {

  // https://github.com/jerryc127/hexo-theme-butterfly
  diffDate: (d, more = false) => {
    const dateNow = new Date()
    const datePost = new Date(d)
    const dateDiff = dateNow.getTime() - datePost.getTime()
    const minute = 1000 * 60
    const hour = minute * 60
    const day = hour * 24

    let result
    if (more) {
      const dayCount = dateDiff / day
      const hourCount = dateDiff / hour
      const minuteCount = dateDiff / minute

      if (dayCount > 14) {
        result = null
      } else if (dayCount >= 1) {
        result = parseInt(dayCount) + ' ' + ctx.date_suffix.day
      } else if (hourCount >= 1) {
        result = parseInt(hourCount) + ' ' + ctx.date_suffix.hour
      } else if (minuteCount >= 1) {
        result = parseInt(minuteCount) + ' ' + ctx.date_suffix.min
      } else {
        result = ctx.date_suffix.just
      }
    } else {
      result = parseInt(dateDiff / day)
    }
    return result
  },

  copy: (id, msg) => {
    const el = document.getElementById(id);
    if (el) {
      el.select();
      navigator.clipboard.writeText(el.value).then(() => {
        if (msg && msg.length > 0) {
          hud.toast(msg, 2500);
        }
      }).catch(() => {});
    }
  },

  toggle: (id) => {
    const el = document.getElementById(id);
    if (el) {
      el.classList.toggle("display");
    }
  },

  scrollTop: () => {
    smoothScrollTo(0);
  },

  scrollComment: () => {
    const el = document.getElementById('comments');
    if (el) {
      smoothScrollTo(el.getBoundingClientRect().top + window.scrollY - 32);
    }
  },

  viewportLazyload: (target, func, enabled = true) => {
    if (!enabled || !("IntersectionObserver" in window)) {
      func();
      return;
    }
    const observer = new IntersectionObserver((entries) => {
      if (entries[0].intersectionRatio > 0) {
        func();
        observer.disconnect();
      }
    });
    observer.observe(target);
  }
}

const hud = {
  toast: (msg, duration) => {
    const d = Number(isNaN(duration) ? 2000 : duration);
    var el = document.createElement('div');
    el.classList.add('toast');
    el.classList.add('show');
    el.innerHTML = msg;
    document.body.appendChild(el);

    setTimeout(function () { document.body.removeChild(el) }, d);

  },

}

// defines

const l_body = document.querySelector('.l_body');

const sidebar = {
  leftbar: () => {
    if (l_body) {
      l_body.toggleAttribute('leftbar');
      l_body.removeAttribute('rightbar');
    }
  },
  rightbar: () => {
    if (l_body) {
      l_body.toggleAttribute('rightbar');
      l_body.removeAttribute('leftbar');
    }
  },
  dismiss: () => {
    if (l_body) {
      l_body.removeAttribute('leftbar');
      l_body.removeAttribute('rightbar');
    }
  },
  toggleTOC: () => {
    document.querySelector('#data-toc').classList.toggle('collapse');
  }
}

// 通用平滑滚动（自定义动画，TOC / 回到顶部 / 参与讨论共用）
let scrollAnim = null;
function cancelSmoothScroll() {
  if (scrollAnim !== null) {
    cancelAnimationFrame(scrollAnim);
    scrollAnim = null;
  }
}
function smoothScrollTo(targetY) {
  cancelSmoothScroll();
  targetY = Math.max(0, targetY);
  const startY = window.scrollY;
  const diff = targetY - startY;
  if (Math.abs(diff) < 2) {
    return;
  }
  // 短距离 300ms，长距离最多 600ms
  const duration = Math.min(600, Math.max(300, Math.abs(diff) * 0.15));
  const startTime = performance.now();
  function step(now) {
    const t = Math.min(1, (now - startTime) / duration);
    const eased = 1 - Math.pow(1 - t, 3); // easeOutCubic
    // 显式指定 instant，避免全局 scroll-behavior: smooth 与自定义动画叠加导致滚动变慢
    window.scrollTo({ top: startY + diff * eased, behavior: 'instant' });
    if (t < 1) {
      scrollAnim = requestAnimationFrame(step);
    } else {
      scrollAnim = null;
    }
  }
  scrollAnim = requestAnimationFrame(step);
}
window.addEventListener('wheel', cancelSmoothScroll, { passive: true });
window.addEventListener('touchstart', cancelSmoothScroll, { passive: true });

// 远程 md（mdrender 服务）渲染完成后重建右栏 TOC：结构与服务端 toc() 输出一致
let tocClickBound = false;
function rebuildToc(scope) {
  const widget = document.querySelector('#data-toc');
  if (!widget) {
    return;
  }
  const body = widget.querySelector('.widget-body');
  if (!body) {
    return;
  }
  const article = scope && scope.closest ? scope.closest('article.md-text') : null;
  const root = article || document.querySelector('article.md-text');
  if (!root) {
    return;
  }
  const headings = root.querySelectorAll('h1,h2,h3,h4,h5,h6');
  if (headings.length === 0) {
    return;
  }
  const ol = document.createElement('ol');
  ol.className = 'toc ui-collection-adapter';
  const stack = [];
  headings.forEach(function (h) {
    const id = h.id;
    if (!id) {
      return;
    }
    const level = parseInt(h.tagName.substring(1), 10);
    const li = document.createElement('li');
    li.className = 'toc-item toc-level-' + level;
    const a = document.createElement('a');
    a.className = 'toc-link';
    a.href = '#' + encodeURIComponent(id);
    const span = document.createElement('span');
    span.className = 'toc-text';
    span.textContent = h.textContent.trim();
    a.appendChild(span);
    li.appendChild(a);
    while (stack.length > 0 && stack[stack.length - 1].level >= level) {
      stack.pop();
    }
    if (stack.length === 0) {
      ol.appendChild(li);
    } else {
      const parent = stack[stack.length - 1];
      if (!parent.childOl) {
        parent.childOl = document.createElement('ol');
        parent.childOl.className = 'toc-child';
        parent.li.appendChild(parent.childOl);
      }
      parent.childOl.appendChild(li);
    }
    stack.push({ level: level, li: li });
  });
  body.innerHTML = '';
  body.appendChild(ol);
  bindTocClick(widget);
}

function bindTocClick(widget) {
  if (tocClickBound) {
    return;
  }
  tocClickBound = true;
  widget.addEventListener('click', function (e) {
    const link = e.target.closest('a.toc-link');
    if (!link) {
      return;
    }
    const href = link.getAttribute('href');
    const id = href && href.indexOf('#') === 0 ? decodeURIComponent(href.slice(1)) : null;
    const target = id && document.getElementById(id);
    if (target) {
      e.preventDefault();
      const offset = 32;
      const targetY = target.getBoundingClientRect().top + window.scrollY - offset;
      smoothScrollTo(targetY);
      if (window.history && window.history.pushState) {
        window.history.pushState(null, '', href);
      }
    }
  });
}

// 通用页内锚点平滑滚动（标题左侧 headerlink、{% navbar %} 页内导航、脚注回链等）
// 已被其他处理器拦截的点击（TOC、tabs、wiki #start 等）通过 defaultPrevented 跳过，避免重复滚动
function bindAnchorClick() {
  document.addEventListener('click', function (e) {
    const link = e.target.closest('a[href^="#"]');
    if (!link || e.defaultPrevented) {
      return;
    }
    const href = link.getAttribute('href');
    if (!href || href.indexOf('#') !== 0) {
      return;
    }
    let id = href.slice(1);
    try {
      id = decodeURIComponent(id);
    } catch (err) {
      // 片段含非法编码时按原样查找
    }
    const target = id && document.getElementById(id);
    if (!target) {
      return;
    }
    e.preventDefault();
    // #start 锚点贴顶滚动，不预留 offset；其余锚点与 TOC 点击滚动保持一致（32px）
    const offset = id === 'start' ? 0 : 32;
    const targetY = target.getBoundingClientRect().top + window.scrollY - offset;
    smoothScrollTo(targetY);
    if (window.history && window.history.pushState) {
      window.history.pushState(null, '', href);
    }
  });
}
bindAnchorClick();

// 远程 md 渲染完成后由页面层重建右栏 TOC
document.addEventListener('stellar:mdrender', function (e) {
  rebuildToc(e.detail && e.detail.target);
});


const init = {
  toc: () => {
    const scrollOffset = 32;
    // 滚动位置取整后标题顶可能落在偏移线下方 1~2px，加容差避免高亮回跳到上一条
    const scrollTolerance = 4;
    function activeTOC() {
      // 每次滚动动态查询：远程 md 内容渲染后标题才存在
      var segs = utils.qsa("article.md-text h1, article.md-text h2, article.md-text h3, article.md-text h4, article.md-text h5, article.md-text h6");
      var scrollTop = window.scrollY;
      var topSeg = null;
      for (var i = 0; i < segs.length; i++) {
        var segTop = segs[i].getBoundingClientRect().top + window.scrollY;
        if (segTop > scrollTop + scrollOffset + scrollTolerance) {
          continue;
        }
        if (!topSeg || segTop >= topSeg.getBoundingClientRect().top + window.scrollY) {
          topSeg = segs[i];
        }
      }
      if (topSeg) {
        utils.dom("#data-toc a.toc-link").removeClass("active");
        var id = topSeg.getAttribute("id");
        var link = id ? "#" + id : "#undefined";
        if (link != '#undefined') {
          const highlightItem = utils.dom('#data-toc a.toc-link[href="' + encodeURI(link) + '"]');
          if (highlightItem.length > 0) {
            highlightItem.addClass("active");
          }
        } else {
          const first = utils.qs('#data-toc a.toc-link');
          if (first) first.classList.add("active");
        }
      }
    }
    function scrollTOC() {
      const e0 = document.querySelector('#data-toc .toc');
      const e1 = document.querySelector('#data-toc .toc a.toc-link.active');
      if (e0 == null || e1 == null) {
        return;
      }
      const offsetBottom = e1.getBoundingClientRect().bottom - e0.getBoundingClientRect().bottom + 100;
      const offsetTop = e1.getBoundingClientRect().top - e0.getBoundingClientRect().top - 64;
      if (offsetTop < 0) {
        e0.scrollBy({ top: offsetTop, behavior: "smooth" });
      } else if (offsetBottom > 0) {
        e0.scrollBy({ top: offsetBottom, behavior: "smooth" });
      }
    }

    var timeout = null;
    window.addEventListener('scroll', function () {
      activeTOC();
      if (timeout !== null) clearTimeout(timeout);
      timeout = setTimeout(function () {
        scrollTOC();
      }, 50);
    });
  },
  sidebar: () => {
    utils.dom("#data-toc a.toc-link").click(function (e) {
      const href = this.getAttribute("href");
      const id = href && href.indexOf("#") === 0 ? decodeURIComponent(href.slice(1)) : null;
      const target = id && document.getElementById(id);
      if (target) {
        e.preventDefault();
        const offset = 32; // 与 activeTOC 的 scrollOffset 保持一致
        const targetY = target.getBoundingClientRect().top + window.scrollY - offset;
        smoothScrollTo(targetY);
        if (window.history && window.history.pushState) {
          window.history.pushState(null, "", href);
        }
      }
      window.sidebar.dismiss();
    });
  },
  wikiStart: () => {
    utils.dom('#l_cover .l_cover.wiki .start-wrap a.button.start').click(function (e) {
      const href = this.getAttribute("href");
      const id = href && href.indexOf("#") === 0 ? decodeURIComponent(href.slice(1)) : null;
      const target = id && document.getElementById(id);
      if (target) {
        e.preventDefault();
        // #start 锚点贴顶滚动，不预留 offset
        const offset = 0;
        smoothScrollTo(target.getBoundingClientRect().top + window.scrollY - offset);
        if (window.history && window.history.pushState) {
          window.history.pushState(null, "", href);
        }
      }
    });
  },
  wikiCover: () => {
    document.querySelectorAll('.wiki-cover-terminal').forEach(function (terminal) {
      const code = terminal.querySelector('pre code');
      const tabs = terminal.querySelectorAll('[role="tab"]');
      function renderCodes(value) {
        const lines = value.split(/\r?\n/).filter(function (line) {
          return line.trim().length > 0;
        });
        terminal.dataset.codes = lines.join('\n');
        code.innerHTML = '';
        lines.forEach(function (line) {
          const row = document.createElement('span');
          row.textContent = line;
          code.appendChild(row);
        });
      }
      if (tabs.length > 0) {
        renderCodes(tabs[0].getAttribute('data-codes') || '');
      }
      tabs.forEach(function (tab) {
        tab.addEventListener('click', function () {
          tabs.forEach(function (item) {
            const active = item === tab;
            item.classList.toggle('active', active);
            item.setAttribute('aria-selected', active ? 'true' : 'false');
          });
          renderCodes(tab.getAttribute('data-codes') || '');
        });
      });
      const copy = terminal.querySelector('.wiki-cover-copy');
      if (copy) {
        copy.addEventListener('click', function () {
          const value = terminal.dataset.codes || '';
          if (!value || !navigator.clipboard) return;
          navigator.clipboard.writeText(value).then(function () {
            hud.toast(copy.getAttribute('data-copy-message') || 'Copied', 2500);
          }).catch(function () {});
        });
      }
    });

    const galaxyCanvases = document.querySelectorAll('.wiki-cover-background.galaxy canvas');
    const reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduceMotion || galaxyCanvases.length === 0) return;
    utils.js('/js/plugins/galaxy.js').then(function () {
      if (stellar.galaxy && typeof stellar.galaxy.mountAll === 'function') {
        stellar.galaxy.mountAll(galaxyCanvases);
      }
    }).catch(function () {});
  },
  leftbarScroll: () => {
    const container = document.querySelector('.l_left .widgets');
    if (container == null) {
      return;
    }
    const PREFIX = 'Stellar.leftbarScroll.';
    const encode = (s) => encodeURIComponent(String(s || ''));
    function scope() {
      const wikiEl = document.querySelector('.doc-tree-widget[data-wiki]');
      if (wikiEl != null) {
        return 'wiki:' + encode(wikiEl.getAttribute('data-wiki'));
      }
      const notebookEl = document.querySelector('widget[data-notebook]');
      if (notebookEl != null) {
        return 'notebook:' + encode(notebookEl.getAttribute('data-notebook'));
      }
      const body = document.querySelector('.l_body');
      return 'layout:' + encode((body && body.getAttribute('layout')) || 'default');
    }
    window.addEventListener('pagehide', function () {
      try {
        const s = scope();
        sessionStorage.setItem(PREFIX + s, String(container.scrollTop));
        sessionStorage.setItem(PREFIX + 'last', s);
      } catch (e) {}
    });
    try {
      const s = scope();
      // 仅当上一页与当前页属于同一分区时才恢复，离开分区后再回来不跳回旧位置
      if (sessionStorage.getItem(PREFIX + 'last') !== s) {
        return;
      }
      const value = sessionStorage.getItem(PREFIX + s);
      if (value == null) {
        return;
      }
      container.scrollTop = parseInt(value, 10) || 0;
      const link = container.querySelector('.ui-collection__item.is-active');
      if (link == null) {
        return;
      }
      const padding = 16;
      const containerRect = container.getBoundingClientRect();
      const linkRect = link.getBoundingClientRect();
      const top = linkRect.top - containerRect.top;
      const bottom = linkRect.bottom - containerRect.top;
      if (top < 0) {
        container.scrollTop += top - padding;
      } else if (bottom > container.clientHeight) {
        container.scrollTop += bottom - container.clientHeight + padding;
      }
    } catch (e) {}
  },
  navbarPin: () => {
    // 列表页 navbar top 背景条状态切换：未滚动/未吸顶为卡片样式（var(--card) + 文章卡片同款阴影），
    // 页面滚动达到阈值且吸顶后恢复玻璃效果。在吸顶边界切换 .pinned 类，视觉由 CSS 控制。
    // 吸顶判定直接测 navbar 的实际视口位置，而非用 scrollY 推算：
    // 移动端浏览器顶栏伸缩会改变 scrollY（展开顶栏时 scrollY 减小），
    // 即使 navbar 仍吸顶也可能跌破阈值，导致玻璃效果误消失。
    // 无轮播区页面（如 wiki）的 navbar 在页面顶部即已吸顶，需额外要求页面实际滚动达到阈值，
    // 否则默认保持卡片样式；回到顶部（滚动小于阈值）恢复卡片。
    const navbars = document.querySelectorAll('.navbar.top');
    if (navbars.length === 0) {
      return;
    }
    // 视口顶部允许的偏差（px），吸收亚像素/取整误差
    const TOLERANCE = 2;
    // 页面滚动阈值（px）：未滚动时保持卡片样式，滚动达到该值后才切换玻璃效果
    const SCROLL_THRESHOLD = 2;
    let states = [];
    function update() {
      const scrolled = window.scrollY >= SCROLL_THRESHOLD;
      states.forEach((state) => {
        const top = state.navbar.getBoundingClientRect().top;
        state.bar.classList.toggle('pinned', scrolled && top <= state.stickyTop + TOLERANCE);
      });
    }
    function measure() {
      states = [];
      navbars.forEach((navbar) => {
        const bar = navbar.querySelector('.navbar-blur');
        if (bar == null) {
          return;
        }
        // getComputedStyle().top 自动兼容桌面 var(--gap-page) 与移动端 8pt
        const stickyTop = parseFloat(getComputedStyle(navbar).top) || 16;
        states.push({
          navbar: navbar,
          bar: bar,
          stickyTop: stickyTop
        });
      });
      update();
    }
    let ticking = false;
    window.addEventListener('scroll', () => {
      if (ticking) {
        return;
      }
      ticking = true;
      utils.requestAnimationFrame(() => {
        update();
        ticking = false;
      });
    }, { passive: true });
    // 顶栏伸缩不一定触发 scroll，兜底监听 visualViewport 尺寸变化
    if (window.visualViewport) {
      window.visualViewport.addEventListener('resize', update);
    }
    window.addEventListener('resize', measure);
    window.addEventListener('pageshow', measure);
    measure();
  },
  relativeDate: (selector) => {
    selector.forEach(item => {
      const $this = item
      const timeVal = $this.getAttribute('datetime')
      let relativeValue = util.diffDate(timeVal, true)
      if (relativeValue) {
        $this.innerText = relativeValue
      }
    })
  },
  /**
   * Tabs tag listener (without twitter bootstrap).
   */
  registerTabsTag: function () {
    // Binding `nav-tabs` & `tab-content` by real time permalink changing.
    document.querySelectorAll('.tabs .nav-tabs .tab').forEach(element => {
      element.addEventListener('click', event => {
        event.preventDefault();
        // Prevent selected tab to select again.
        if (element.classList.contains('active')) return;
        // Add & Remove active class on `nav-tabs` & `tab-content`.
        [...element.parentNode.children].forEach(target => {
          target.classList.toggle('active', target === element);
        });
        // https://stackoverflow.com/questions/20306204/using-queryselector-with-ids-that-are-numbers
        const tActive = document.getElementById(element.querySelector('a').getAttribute('href').replace('#', ''));
        [...tActive.parentNode.children].forEach(target => {
          target.classList.toggle('active', target === tActive);
        });
        // Trigger event
        tActive.dispatchEvent(new Event('tabs:click', {
          bubbles: true
        }));
      });
    });

    window.dispatchEvent(new Event('tabs:register'));
  },

  canonicalCheck: () => {
    const canonical = window.canonical;
    // 真实主站域名优先从 encoded（base64）反解，避免被「批量替换域名」的克隆站把提示指向自己
    const getOriginalHost = () => {
      try {
        return atob(canonical.encoded || '') || canonical.originalHost || '';
      } catch (e) {
        return canonical.originalHost || '';
      }
    };
    function originStatusCheck() {
      return new Promise((resolve) => {
        if (getOriginalHost() === window.location.hostname) {
          resolve(true);
          return;
        }
        const scriptUrl = `https://${getOriginalHost()}${window.canonical.param.checklink}`;
        const script = document.createElement('script');
        script.src = scriptUrl;
        script.type = 'text/javascript';
        script.onload = function () { resolve(true); };
        script.onerror = function () { resolve(false); };
        document.head.appendChild(script);
      });
    }
    async function showTip(isOfficial = false) {
      const meta = document.createElement('meta');
      meta.name = 'robots';
      meta.content = 'noindex, nofollow';
      document.head.appendChild(meta);
      const notice = document.createElement('div');
      const originalURL = `https://${getOriginalHost()}`;
      let currentURL = originalURL;
      if (canonical.param.permalink && canonical.param.permalink.startsWith("http")) {
        try {
          const permalinkURL = new URL(canonical.param.permalink);
          currentURL = `${originalURL}${permalinkURL.pathname}${permalinkURL.search}`;
        } catch (e) {
          // permalink 异常时退回源站首页
        }
      }
      if (isOfficial) {
        if (!(await originStatusCheck())) return;
        notice.className = 'canonical-tip official';
        notice.innerHTML = `
          <a href="${currentURL}" target="_self" rel="noopener noreferrer">
          本站为官方备用站，仅供应急。点击移步主站<br>${originalURL}
          </a>
        `;
      } else {
        notice.className = 'canonical-tip unofficial';
        notice.innerHTML = `
        <a href="${currentURL}" target="_self" rel="noopener noreferrer">
        <div class="headline icon">☠️</div>
        本站为非法克隆站，请前往官方源站访问。<br>
        源站：${originalURL}
        </a>
        `;
      }
      document.body.appendChild(notice);
    }
    if (!getOriginalHost()) return;
    const currentURL = new URL(window.location.href);
    const currentHost = currentURL.hostname.replace(/^www\./, '');
    if (currentHost == 'localhost') return;
    const encodedCurrentHost = window.btoa(currentHost);
    const isCurrentHostValid = canonical.encoded === encodedCurrentHost;
    const canonicalTag = document.querySelector('link[rel="canonical"]');
    if (!canonicalTag) {
      if (isCurrentHostValid) {
        return;
      }
      if (canonical.officialHosts?.includes(currentHost)) {
        showTip(true);
        return;
      }
      showTip(false);
      return;
    }
    const canonicalURL = new URL(canonicalTag.href);
    const canonicalHost = canonicalURL.hostname.replace(/^www\./, '');
    const encodedCanonicalHost = window.btoa(canonicalHost);
    const isCanonicalHostValid = canonical.encoded === encodedCanonicalHost;
    if (isCanonicalHostValid && isCurrentHostValid) {
      return;
    }
    showTip(canonical.officialHosts?.includes(currentHost));
  }

}


// Stellar namespace
window.stellar = window.stellar || {};

/**
 * Initialize page components
 */
stellar.initPage = function () {
  init.toc();
  init.sidebar();
  init.wikiStart();
  init.wikiCover();
  init.leftbarScroll();
  init.navbarPin();
  init.relativeDate(document.querySelectorAll('#post-meta time'));
  init.registerTabsTag();
};

// Initial page load
stellar.initPage();
init.canonicalCheck();
