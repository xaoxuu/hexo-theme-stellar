utils.jq(() => {
  $(function () {
    const els = document.getElementsByClassName('ds-fcircle');
    for (var i = 0; i < els.length; i++) {
      const el = els[i];
      const api = el.getAttribute('api');
      if (api == null) {
        continue;
      }
      const default_avatar = def.avatar;
      // layout
      utils.request(el, api, async resp => {
        const data = await resp.json();
        const arr = data.article_data || [];
        const limit = el.getAttribute('limit');
        arr.forEach((item, i) => {
          if (limit && i >= limit) {
            return;
          }
          var cell = '<div class="timenode" index="' + i + '">';
          cell += '<div class="header">';
          cell += '<div class="user-info">';
          cell += '<img src="' + (item.avatar || default_avatar) + '" onerror="javascript:this.src=\'' + default_avatar + '\';">';
          cell += '<span>' + item.author + '</span>';
          cell += '</div>';
          cell += '<span>' + item.created + '</span>';
          cell += '</div>';
          cell += '<a class="body" href="' + item.link + '" target="_blank" rel="external nofollow noopener noreferrer">';
          cell += item.title;
          cell += '</a>';
          cell += '</div>';
          $(el).append(cell);
        });
      });
    }
  });
});