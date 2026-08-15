(function () {
  const els = document.getElementsByClassName('ds-weibo');
    for (var i = 0; i < els.length; i++) {
      const el = els[i];
      const api = el.dataset.api;
      if (api == null) {
        continue;
      }
      const default_avatar = el.getAttribute('avatar') || def.avatar;
      // layout
      utils.request(el, api, async resp => {
        const data = await resp.json();
        const arr = data.tweets || [];
        const limit = el.getAttribute('limit');
        arr.forEach((item, i) => {
          if (limit && i >= limit) {
            return;
          }
          var cell = '<div class="timenode" index="' + i + '">';
          cell += '<div class="header">';
          cell += '<div class="user-info">';
          cell += '<img src="' + (data.user.avatar_hd || default_avatar) + '" onerror="javascript:this.src=\'' + default_avatar + '\';">';
          cell += '<span>' + data.user.nick_name + '</span>';
          cell += '</div>';
          cell += '<span>' + item.created_at + '</span>';
          cell += '</div>';
          cell += '<div class="body">';
          cell += '<a class="body" href="' + item.url + '" target="_blank" rel="external nofollow noopener noreferrer">';
          cell += item.content;
          cell += '</a>';
          // cell += '</div>';
          // 每条微博的右下角 转发 评论 点赞
          cell += '<div class="footer">';
          cell += '<div class="flex left">';
          cell += '</div>';
          cell += '<div class="flex right">';
          cell += '<div class="item reaction repost">';
          cell += '<a class="item comments last" href="' + item.url + '#issuecomment-new" target="_blank" rel="external nofollow noopener noreferrer">';
          cell += '<span>' + ctx.icons['weibo:repeat'] + ' ' + item.reposts_count + '</span>';
          cell += '</a>';
          cell += '</div>';
          cell += '<a class="item comments last" href="' + item.url + '#issuecomment-new" target="_blank" rel="external nofollow noopener noreferrer">';
          cell += '<span>' + ctx.icons['weibo:comment'] + ' '
          + (item.comments_count || 0) + '</span>';
          cell += '</a>';
          cell += '<div class="item reaction attitudes">';
          cell += '<a class="item comments last" href="' + item.url + '#issuecomment-new" target="_blank" rel="external nofollow noopener noreferrer">';
          cell += '<span>' + ctx.icons['weibo:like'] + ' ' + item.attitudes_count + '</span>';
          cell += '</a>';
          cell += '</div>';

          cell += '</div>';
          cell += '</div>';
          // 右下角结束
          utils.dom(el).append(cell);
        });
      });
    }
})();
