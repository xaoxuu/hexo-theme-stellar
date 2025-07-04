utils.jq(() => {
  $(function () {
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
          cell += '<span>' + '🔗' + ' ' + item.reposts_count + '</span>';
          cell += '</a>';
          cell += '</div>';
          cell += '<a class="item comments last" href="' + item.url + '#issuecomment-new" target="_blank" rel="external nofollow noopener noreferrer">';
          cell += '<span><svg t="1666270368054" class="icon" viewBox="0 0 1024 1024" version="1.1" xmlns="http://www.w3.org/2000/svg" p-id="2528" width="200" height="200"><path d="M952 64H72C32.3 64 0 96.3 0 136v508c0 39.7 32.3 72 72 72h261l128 128c14 14 32.5 21.1 50.9 21.1s36.9-7 50.9-21.1l128-128h261c39.7 0 72-32.3 72-72V136c0.2-39.7-32.1-72-71.8-72zM222 462c-39.8 0-72-32.2-72-72s32.2-72 72-72 72 32.2 72 72-32.2 72-72 72z m290-7.7c-39.8 0-72-32.2-72-72s32.2-72 72-72 72 32.2 72 72c0 39.7-32.2 72-72 72z m290 8c-39.8 0-72-32.2-72-72s32.2-72 72-72 72 32.2 72 72c0 39.7-32.2 72-72 72z" p-id="2529"></path></svg> '
          + (item.comments_count || 0) + '</span>';
          cell += '</a>';
          cell += '<div class="item reaction attitudes">';
          cell += '<a class="item comments last" href="' + item.url + '#issuecomment-new" target="_blank" rel="external nofollow noopener noreferrer">';
          cell += '<span>' + '👍' + ' ' + item.attitudes_count + '</span>';
          cell += '</a>';
          cell += '</div>';

          cell += '</div>';
          cell += '</div>';
          // 右下角结束
          $(el).append(cell);
        });
      });
    }
  });
});