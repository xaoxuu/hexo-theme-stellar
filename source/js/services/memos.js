utils.jq(() => {
  $(function () {
    const els = document.getElementsByClassName('ds-memos');
    for (var i = 0; i < els.length; i++) {
      const el = els[i];
      const api = el.getAttribute('api');
      if (api == null) {
        continue;
      }
      const default_avatar = el.getAttribute('avatar') || def.avatar;
      const limit = el.getAttribute('limit');
      const host = api.replace(/https:\/\/(.*?)\/(.*)/i, '$1');
      // layout
      utils.request(el, api, function(data) {
        var users = [];
        const filter = el.getAttribute('user');
        if (filter && filter.length > 0) {
          users = filter.split(",");
        }
        var hide = [];
        const hideStr = el.getAttribute('hide');
        if (hideStr && hideStr.length > 0) {
          hide = hideStr.split(",");
        }
        data.forEach((item, i) => {
          if (limit && i >= limit) {
            return;
          }
          if (item.user && item.user.login && users.length > 0) {
            if (!users.includes(item.user.login)) {
              return;
            }
          }
          let date = new Date(item.createdTs * 1000)
          var cell = '<div class="timenode" index="' + i + '">';
          cell += '<div class="header">';
          if (!users.length && !hide.includes('user')) {
            cell += '<div class="user-info">';
            if (default_avatar.length > 0) {
              cell += `<img src="${default_avatar}">`;
            }
            cell += '<span>' + item.creatorName + '</span>';
            cell += '</div>';
          }
          cell += '<span>' + date.toLocaleString() + '</span>';
          cell += '</div>';
          cell += '<div class="body">';
          cell += marked.parse(item.content || '');
          var imgs = [];
          for (let res of item.resourceList) {
            if (res.type?.includes('image/')) {
              imgs.push(res);
            }
          }
          if (imgs.length > 0) {
            cell += '<div class="tag-plugin image">';
            for (let img of imgs) {
              if (img.externalLink?.length > 0) {
                cell += `<div class="image-bg"><img src="${img.externalLink}" data-fancybox="memos"></div>`;
              } else {
                cell += `<div class="image-bg"><img src="https://${host}/o/r/${img.id}" data-fancybox="memos"></div>`;
              }
            }
            cell += '</div>';
          }
          cell += '</div>';
          cell += '</div>';
          $(el).append(cell);
        });
      });
    }
  });
});