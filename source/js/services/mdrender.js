/* global module */
/**
 * mdrender.js v2 | https://github.com/xaoxuu/hexo-theme-stellar/
 *
 * 远程 Markdown 渲染底层组件的客户端部分：
 * - 无 data-replace：渲染结果填充进占位元素（容器保留，兼容现状）；
 * - data-replace="true"：占位元素原地替换为渲染结果（最终 DOM 无外部容器）；
 * - data-base：相对图片/链接解析到该基址（GitHub 镜像优先）；
 * - data-heading="true"：标题适配本地文章格式（补 id + headerlink；h1 为页面标题直接隐藏）；
 * - 渲染完成后派发 stellar:mdrender 事件（detail.target 为渲染后的占位元素），
 *   页面层（main.js）监听后重建右栏 TOC。
 */
(function () {
  'use strict';

  // 与 hexo-util slugize（transform=1）保持一致：去 HTML、转小写、特殊字符转 -、
  // 连续分隔符合并、首尾分隔符去除（未做 diacritic 归一化，常见标题不受影响）。
  function slugifyHeading(text) {
    return String(text)
      .replace(/<[^>]*>/g, '')
      // eslint-disable-next-line no-control-regex
      .replace(/[\u0000-\u001f]/g, '')
      .replace(/[\s~`!@#$%^&*()\-_+=[\]{}|\\;:"'<>,.?/]+/g, '-')
      .replace(/-{2,}/g, '-')
      .replace(/^-+|-+$/g, '')
      .toLowerCase();
  }

  // 标题适配：h1 为页面标题（banner 已展示），直接隐藏不降级；其余标题按序补齐 id（冲突加后缀）
  function normalizeHeadings(container, usedIds) {
    const headings = container.querySelectorAll('h1,h2,h3,h4,h5,h6');
    if (headings.length === 0) {
      return;
    }
    headings.forEach(function (h) {
      if (h.tagName === 'H1') {
        h.remove();
      }
    });
    container.querySelectorAll('h1,h2,h3,h4,h5,h6').forEach(function (h) {
      const base = slugifyHeading(h.textContent) || 'section';
      let id = base;
      let suffix = 1;
      while (usedIds.has(id)) {
        id = base + '-' + suffix;
        suffix++;
      }
      usedIds.add(id);
      h.id = id;
      // 与本地 hexo-renderer-marked 输出一致：标题内追加 headerlink 锚点
      const anchor = document.createElement('a');
      anchor.setAttribute('href', '#' + id);
      anchor.className = 'headerlink';
      anchor.setAttribute('title', h.textContent.trim());
      h.insertBefore(anchor, h.firstChild);
    });
  }

  // 相对图片/链接解析到 data-base（# 锚点、绝对 URL、协议相对地址等不动）
  function rewriteRelativeUrls(container, base) {
    container.querySelectorAll('img[src],a[href]').forEach(function (el) {
      const attr = el.tagName === 'IMG' ? 'src' : 'href';
      const val = el.getAttribute(attr);
      if (!val) {
        return;
      }
      if (/^(#|https?:|mailto:|tel:|data:|javascript:)/i.test(val) || val.startsWith('//')) {
        return;
      }
      try {
        el.setAttribute(attr, new URL(val, base).href);
      } catch (e) {
        // 无法解析的相对地址保持原样
      }
    });
  }

  function render(el) {
    const src = el.getAttribute('src');
    if (!src) {
      return;
    }
    const url = src + '?t=' + new Date().getTime();
    utils.request(el, url, async resp => {
      const data = await resp.text();
      const tmp = document.createElement('div');
      tmp.innerHTML = marked.parse(data);
      const base = el.getAttribute('data-base');
      if (base) {
        rewriteRelativeUrls(tmp, base);
      }
      if (el.getAttribute('data-heading') === 'true') {
        const usedIds = new Set();
        const scope = el.closest('article, .md-text') || document;
        scope.querySelectorAll('[id]').forEach(function (node) {
          usedIds.add(node.id);
        });
        normalizeHeadings(tmp, usedIds);
      }
      if (el.getAttribute('data-replace') === 'true') {
        el.replaceWith.apply(el, Array.from(tmp.childNodes));
      } else {
        el.innerHTML = tmp.innerHTML;
      }
      document.dispatchEvent(new CustomEvent('stellar:mdrender', { detail: { target: el } }));
    });
  }

  // Node 单测入口：仅导出纯函数，浏览器环境不命中此分支
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
      slugifyHeading: slugifyHeading
    };
    return;
  }

  const els = document.getElementsByClassName('ds-mdrender');
  for (var i = 0; i < els.length; i++) {
    render(els[i]);
  }
})();
