utils.jq(() => {
    $(function () {
      const els = document.getElementsByClassName('ds-waline');
      for (var i = 0; i < els.length; i++) {
        const el = els[i];
        const limit = parseInt(el.getAttribute('limit')) || 10;
        const apiBase = el.getAttribute('api');
        if (apiBase == null) {
          continue;
        }
        const api = apiBase + '/comment?type=recent&count=' + limit;
        const default_avatar = def.avatar;
        utils.request(el, api, function(data) {
          data.forEach((item, i) => {
            var cell = '<div class="timenode" index="' + i + '">';
            cell += '<div class="header">';
            cell += '<div class="user-info">';
            cell += '<img src="' + (item.avatar || default_avatar) + '" onerror="javascript:this.src=\'' + default_avatar + '\';">';
            cell += '<span>' + item.nick + '</span>';
            cell += '</div>';
            cell += '<span>' + new Date(item.time).toLocaleString() + '</span>';
            cell += '</div>';
            cell += '<a class="body" href="' + item.url + '#' + item.objectId + '" target="_blank" rel="external nofollow noopener noreferrer">';
            cell += item.comment.replace(/<a\b[^>]*>(.*?)<\/a>/g, '$1');
            cell += '</a>';
            cell += '</div>';
            $(el).append(cell);
          });
        });
      }
    });
  });