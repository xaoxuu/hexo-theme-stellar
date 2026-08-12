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
            // content_marked 是完整 HTML：保留表情图（atk-emoticon），
            // 其余标签转纯文本并截断，避免大尺寸表情图与段落撑爆侧栏卡片
            var html = item.content_marked || '';
            var emojiRe = /<img\b[^>]*\batk-emoticon\b[^>]*>/gi;
            var emojiTags = html.match(emojiRe) || [];
            var textParts = html.split(emojiRe).map(function (part) {
              return part
                .replace(/<[^>]*>/g, ' ')
                .replace(/&nbsp;/g, ' ')
                .replace(/&amp;/g, '&')
                .replace(/&lt;/g, '<')
                .replace(/&gt;/g, '>')
                .replace(/&quot;/g, '"')
                .replace(/&#0?39;/g, "'")
                .replace(/\s+/g, ' ')
                .trim();
            });
            var MAX_TEXT = 50;
            var MAX_EMOJI = 3;
            var textLen = 0;
            var keptEmoji = 0;
            var preview = '';
            for (var k = 0; k < textParts.length; k++) {
              var seg = textParts[k];
              if (seg) {
                var need = MAX_TEXT - textLen;
                if (seg.length > need) {
                  preview += seg.substring(0, need) + '...';
                  break; // 截断后丢弃后续文本与表情
                }
                preview += seg + ' ';
                textLen += seg.length;
              }
              if (k < emojiTags.length && keptEmoji < MAX_EMOJI) {
                preview += emojiTags[k];
                keptEmoji += 1;
              }
            }
            preview = preview.trim();
            if (preview.length === 0) {
              return; // 跳过空评论
            }
            var cell = '<div class="timenode" index="' + i + '">';
            cell += '<div class="header">';
            cell += '<div class="user-info">';
            // cell += '<img src="https://cravatar.cn/avatar/' + (item.email_encrypted) + '?d=mp&s=240">';
            cell += '<span>' + item.nick + '</span>';
            cell += '</div>';
            cell += '<span>' + new Date(item.date).toLocaleString() + '</span>';
            cell += '</div>';
            cell += '<a class="body" href="' + item.page_url + '#atk-comment-' + item.id + '" target="_blank" rel="external nofollow noopener noreferrer">';
            cell += preview;
            cell += '</a>';
            cell += '</div>';
            utils.dom(el).append(cell);
          });
        });
      }
})();
  
