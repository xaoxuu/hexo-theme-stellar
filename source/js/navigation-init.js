  // Fix: Ensure page is at the correct top position on data load
  if (history.scrollRestoration) {
    history.scrollRestoration = 'auto';
  }
  (function() {
    const scrollHandler = () => {
      // 存在有效锚点时，等待布局稳定后滚动到目标
      // （浏览器原生锚点滚动发生在布局完成前，长文章的懒加载图片/异步组件会把目标顶偏）
      const hash = window.location.hash;
      if (hash.length > 1) {
        let anchorId = hash.slice(1);
        try {
          anchorId = decodeURIComponent(anchorId);
        } catch (e) {
          // 片段含非法编码时按原样查找
        }
        const anchor = document.getElementById(anchorId);
        if (anchor) {
          // #start 锚点贴顶，不预留 offset；其余锚点与 TOC 点击滚动保持一致
          const offset = anchorId === 'start' ? 0 : 32;
          const targetY = () => anchor.getBoundingClientRect().top + window.scrollY - offset;
          let timer = null;
          let frame = null;
          let lastY = null;
          let quiet = 0;
          let attempts = 0;
          // 记录最近一次资源加载完成时间，判断异步数据/图片是否仍在改变布局
          let lastResourceTime = performance.now();
          let observer = null;
          try {
            observer = new PerformanceObserver(function (list) {
              lastResourceTime = performance.now();
            });
            observer.observe({ entryTypes: ['resource'] });
          } catch (e) {}
          // 只跟踪主题 request/cache 客户端，不替换浏览器原生 fetch/XHR。
          const pendingRequests = new Set();
          const onRequestStart = event => pendingRequests.add(event.detail.key);
          const onRequestEnd = event => pendingRequests.delete(event.detail.key);
          document.addEventListener('stellar:request-start', onRequestStart);
          document.addEventListener('stellar:request-end', onRequestEnd);
          const cancel = () => {
            if (frame !== null) cancelAnimationFrame(frame);
            for (const name of ['wheel', 'touchstart', 'mousedown', 'keydown', 'pagehide']) window.removeEventListener(name, cancel);
            if (timer !== null) {
              clearInterval(timer);
              timer = null;
            }
            if (observer !== null) {
              try {
                observer.disconnect();
              } catch (e) {}
            }
            document.removeEventListener('stellar:request-start', onRequestStart);
            document.removeEventListener('stellar:request-end', onRequestEnd);
          };
          const adjust = () => {
            const y = targetY();
            const atTarget = Math.abs(window.scrollY - y) <= 2;
            if (!atTarget || lastY === null || Math.abs(y - lastY) > 2) {
              window.scrollTo({ top: y, behavior: 'instant' });
              lastY = y;
              quiet = 0;
            } else {
              quiet++;
            }
            attempts++;
            const resourceQuiet = performance.now() - lastResourceTime > 3000;
            // 位置连续 1.8 秒无变化、无进行中的请求且最近 3 秒无资源加载才视为稳定；最长等待 30 秒
            if ((quiet >= 3 && pendingRequests.size === 0 && resourceQuiet) || attempts >= 50) {
              cancel();
            }
          };
          frame = requestAnimationFrame(() => {
            // 锚点链接打开时直接定位，不做动画；用户主动点击（如 TOC）仍走平滑滚动
            window.scrollTo({ top: targetY(), behavior: 'instant' });
            timer = setInterval(adjust, 600);
          });
          // 用户主动滚动时停止自动校正
          window.addEventListener('pagehide', cancel, { once: true });
          window.addEventListener('wheel', cancel, { passive: true });
          window.addEventListener('touchstart', cancel, { passive: true });
          window.addEventListener('mousedown', cancel, { passive: true });
          window.addEventListener('keydown', cancel, { passive: true });
          return;
        }
      }
      // 没有锚点时始终保持页面顶部；Wiki Hero 只在用户显式访问 #start 时定位正文。
      window.scrollTo(0, 0);
    };
    if (document.readyState !== 'loading') scrollHandler();
    else document.addEventListener('DOMContentLoaded', scrollHandler);
  })();
  // 搜索跳转高亮：URL 带 ?kw= 时按需加载，定位正文中的匹配词
  (function () {
    try {
      if (!window.location.search) return;
      if (!new URLSearchParams(window.location.search).has('kw')) return;
      document.addEventListener('DOMContentLoaded', function () {
        // utils 由前置 /js/utils.js 同步定义（同时暴露 window.utils）。
        if (typeof utils === 'object' && typeof utils.js === 'function') {
          utils.js(ctx.root + 'js/search/highlight.js', { defer: true }).catch(function () {});
        }
      });
    } catch (e) {}
  })();
