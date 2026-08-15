(function () {
  const reactions = {
      '+1': '👍',
      '-1': '👎', 
      'laugh': '😀', 
      'hooray': '🎉', 
      'confused': '😕', 
      'heart': '❤️', 
      'rocket': '🚀', 
      'eyes': '👀'
    }
    const timelines = document.getElementsByClassName('ds-timeline');
    for (var i = 0; i < timelines.length; i++) {
      const el = timelines[i];
      const api = el.dataset.api;
      if (api == null) {
        continue;
      }
      // layout
      utils.request(el, api, async resp => {
        const data = await resp.json();
        const query = new URL(api).search;
        const arr = data.content || data;
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
        arr.forEach((item, i) => {
          if (item.user && item.user.login && users.length > 0) {
            if (!users.includes(item.user.login)) {
              return;
            }
          }
          var cell = '<div class="timenode" index="' + i + '">';
          cell += '<div class="header">';
          if (!users.length && item.user && !hide.includes('user')) {
            cell += '<a class="user-info" href="' + item.user.html_url + '" target="_blank" rel="external nofollow noopener noreferrer">';
            cell += '<img src="' + item.user.avatar_url + '">';
            cell += '<span>' + item.user.login + '</span>';
            cell += '</a>';
          }
          let date = new Date(item.created_at);
          cell += '<span>' + date.toLocaleString() + '</span>';
          cell += '</div>';
          cell += '<div class="body">';
          if (!hide.includes('title')) {
            cell += '<p class="title">';
            cell += '<a href="' + item.html_url + '" target="_blank" rel="external nofollow noopener noreferrer">';
            cell += item.title || item.name || item.tag_name;
            cell += '</a>';
            cell += '</p>';
          }
          
          cell += marked.parse(item.body || '');
          if (!hide.includes('footer')) {
            cell += '<div class="footer">';
            cell += '<div class="flex left">';
            if (item.labels) {
              item.labels.forEach((label, i) => {
                if (!query || !query.includes(encodeURI(label.name))) {
                  cell += '<div class="item label ' + label.name + '" style="background:#' + label.color + '18;border-color:#' + label.color + '36">';
                  cell += '<span>' + label.name + '</span>';
                  cell += '</div>';
                }
              });
            } else if (item.zipball_url) {
              cell += '<a class="item download" href="' + item.zipball_url + '" target="_blank" rel="external nofollow noopener noreferrer">';
              cell += '<span>📦 ' + item.tag_name + '.zip</span>';
              cell += '</a>';
            }
            cell += '</div>';
            cell += '<div class="flex right">';
            if (item.reactions?.total_count > 0) {
              for (let key of Object.keys(reactions)) {
                let num = item.reactions[key];
                if (num > 0) {
                  cell += '<div class="item reaction ' + key + '">';
                  cell += '<span>' + reactions[key] + ' ' + item.reactions[key] + '</span>';
                  cell += '</div>';
                }
              }
            }
            if (item.comments != null) {
              cell += '<a class="item comments last" href="' + item.html_url + '#issuecomment-new" target="_blank" rel="external nofollow noopener noreferrer">';
              cell += '<span>' + ctx.icons['weibo:comment'] + ' ' + (item.comments || 0) + '</span>';
              cell += '</a>';
            }
            
            cell += '</div>';
            cell += '</div>';
          }
          
          cell += '</div>';
          cell += '</div>';
          utils.dom(el).append(cell);
        });
        window.wrapLazyloadImages(el);
      });
    }
})();
