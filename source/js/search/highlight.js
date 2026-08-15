// 搜索跳转高亮：URL 带 ?kw= 时在正文中高亮匹配词
(function () {
  var params;
  try {
    params = new URLSearchParams(window.location.search);
  } catch (e) {
    return;
  }
  var keyword = (params.get('kw') || '').trim();
  if (!keyword) return;

  function escapeRegExp(string) {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }

  function highlightKeyword() {
    // 优先主栏正文（避免命中 wiki 封面等其它 md-text 容器）
    var root = document.querySelector('.l_main .md-text') || document.querySelector('.md-text');
    if (!root) return;

    var re = new RegExp(escapeRegExp(keyword), 'gi');
    var textNodes = [];
    var walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
      acceptNode: function (node) {
        var parent = node.parentElement;
        if (!parent) return NodeFilter.FILTER_REJECT;
        // 跳过脚本/样式内容与已存在的 mark 高亮
        if (parent.closest('script, style, noscript, .tag-plugin.mark')) {
          return NodeFilter.FILTER_REJECT;
        }
        return NodeFilter.FILTER_ACCEPT;
      }
    });
    var node;
    while ((node = walker.nextNode())) {
      textNodes.push(node);
    }

    var limit = 50;
    var count = 0;
    for (var i = 0; i < textNodes.length && count < limit; i++) {
      var textNode = textNodes[i];
      var text = textNode.nodeValue || '';
      var frag = document.createDocumentFragment();
      var lastIndex = 0;
      var m;
      re.lastIndex = 0;
      while (count < limit && (m = re.exec(text)) !== null) {
        if (m.index > lastIndex) {
          frag.appendChild(document.createTextNode(text.slice(lastIndex, m.index)));
        }
        var mark = document.createElement('mark');
        mark.className = 'tag-plugin colorful mark';
        mark.setAttribute('color', 'yellow');
        mark.textContent = m[0];
        frag.appendChild(mark);
        count += 1;
        lastIndex = m.index + m[0].length;
      }
      if (lastIndex === 0) continue;
      if (lastIndex < text.length) {
        frag.appendChild(document.createTextNode(text.slice(lastIndex)));
      }
      textNode.parentNode.replaceChild(frag, textNode);
    }

    // 无锚点时（intro / 仅标题命中）滚动到第一个匹配词，实现定位
    if (!window.location.hash) {
      var first = root.querySelector('mark.tag-plugin.mark[color="yellow"]');
      if (first) {
        var top = first.getBoundingClientRect().top + window.scrollY - 32;
        window.scrollTo({ top: Math.max(0, top), behavior: 'instant' });
      }
    }
  }

  if (document.readyState !== 'loading') {
    highlightKeyword();
  } else {
    document.addEventListener('DOMContentLoaded', highlightKeyword);
  }
})();
