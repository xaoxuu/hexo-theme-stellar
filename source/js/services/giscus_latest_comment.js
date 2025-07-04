utils.jq(() => {
    $(function () {
      const els = document.getElementsByClassName('ds-giscus');
      for (var i = 0; i < els.length; i++) {
        const el = els[i];
        const api = el.dataset.api;
        if (api == null) {
          continue;
        }
        const default_avatar = def.avatar;
        // layout
        utils.request(el, api, async resp => {
          const data = await resp.json();
          const limit = el.getAttribute('limit');
          data.forEach((item, i) => {
            if (limit && i >= limit) {
              return;
            }
            comment = item.body.length > 50 ? item.body.substring(0, 50) + '...' : item.body;
            var cell = '<div class="timenode" index="' + i + '">';
            cell += '<div class="header">';
            cell += '<div class="user-info">';
            cell += '<img src="' + (item.author.avatarUrl || default_avatar) + '" onerror="javascript:this.src=\'' + default_avatar + '\';">';
            cell += '<span>' + item.author.login + '</span>';
            cell += '</div>';
            cell += '<span>' + new Date(item.createdAt).toLocaleString() + '</span>';
            cell += '</div>';
            cell += '<a class="body" href="' + item.url + '" target="_blank" rel="external nofollow noopener noreferrer">';
            cell += comment;
            cell += '</a>';
            cell += '</div>';
            $(el).append(cell);
          });
        });
      }
    });
  });