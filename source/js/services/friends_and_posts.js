utils.jq(() => {
  $(function () {
    const els = document.getElementsByClassName('ds-friends_and_posts');
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
        for (let item of (data.content || data)) {
          var cell = `<div class="grid-cell user-post-card">`;
          cell += `<div class="avatar-box">`;
          cell += `<a class="card-link" target="_blank" rel="external nofollow noopener noreferrer" href="${item.html_url || item.url}">`;;
          cell += `<img src="${item.avatar_url || item.avatar || item.icon || default_avatar}" onerror="javascript:this.removeAttribute(\'data-src\');this.src=\'${default_avatar}\';"/>`;
          cell += `<span class="title">${item.title || item.login}</span>`;
          cell += `</a>`;
          cell += `<div class="labels">`;
          for (let label of item.labels) {
            if (label.lightness > 75) {
              cell += `<div class="label" style="background:#${label.color};color:hsla(${label.hue}, ${label.saturation}%, 20%, 1);">${label.name}</div>`;
            } else if (label.saturation > 90 && label.lightness > 40) {
              cell += `<div class="label" style="background:#${label.color};color:hsla(${label.hue}, 50%, 20%, 1);">${label.name}</div>`;
            } else {
              cell += `<div class="label" style="background:#${label.color};color:white">${label.name}</div>`;
            }
          }
          cell += `</div>`;
          cell += `</div>`;
          cell += `<div class="previews">`;
          if (item.description) {
            cell += `<div class="desc">${item.description || item.issue_number || ''}</div>`;
          } else {
            cell += `<div class="desc">#${item.issue_number}</div>`;
          }
          cell += `<div class="posts">`;
          if (item.posts?.length > 0) {
            for (let post of item.posts) {
              cell += `<a class="post-link" target="_blank" rel="external nofollow noopener noreferrer" href="${post.link}">`;
              cell += `<span class="title">${post.title}</span>`;
              cell += `<span class="date">${post.published}</span>`;
              cell += `</a>`;
            }
          } else {
            cell += `<span class="no-post">${item.feed?.length > 0 ? 'RSS 解析失败' : '未设置 RSS 链接'}</span>`;
          }
          cell += `</div>`;
          cell += `</div>`;
          cell += `</div>`;
          $(el).find('.grid-box').append(cell);
        }
      });
    }
  });
});