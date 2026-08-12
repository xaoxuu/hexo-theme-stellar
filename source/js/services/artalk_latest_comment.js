(function () {
  const els = document.getElementsByClassName('ds-artalk');
      for (var i = 0; i < els.length; i++) {
        const el = els[i];
        const limit = parseInt(el.getAttribute('limit')) || 10;
  
        const api = el.dataset.api + '&limit=' + limit;
        if (api == null) {
          continue;
        }
        utils.request(el, api, async resp => {
          var data = await resp.json();
          data = data.data || [];
          data.forEach((item, i) => {
            // 正文转纯文本并截断：content_marked 是完整 HTML，
            // 直接渲染会带出大尺寸表情图与段落，撑爆侧栏卡片布局
            var comment = (item.content_marked || '')
              .replace(/<[^>]*>/g, ' ')
              .replace(/&nbsp;/g, ' ')
              .replace(/&amp;/g, '&')
              .replace(/&lt;/g, '<')
              .replace(/&gt;/g, '>')
              .replace(/&quot;/g, '"')
              .replace(/&#0?39;/g, "'")
              .replace(/\s+/g, ' ')
              .trim();
            if (comment.length === 0) {
              return; // 跳过空评论
            }
            comment = comment.length > 50 ? comment.substring(0, 50) + '...' : comment;
            var cell = '<div class="timenode" index="' + i + '">';
            cell += '<div class="header">';
            cell += '<div class="user-info">';
            // cell += '<img src="https://cravatar.cn/avatar/' + (item.email_encrypted) + '?d=mp&s=240">';
            cell += '<span>' + item.nick + '</span>';
            cell += '</div>';
            cell += '<span>' + new Date(item.date).toLocaleString() + '</span>';
            cell += '</div>';
            cell += '<a class="body" href="' + item.page_url + '#atk-comment-' + item.id + '" target="_blank" rel="external nofollow noopener noreferrer">';
            cell += comment;
            cell += '</a>';
            cell += '</div>';
            utils.dom(el).append(cell);
          });
        });
      }
})();
  
