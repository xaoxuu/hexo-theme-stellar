utils.jq(() => {
  $(function () {
    const els = document.getElementsByClassName('ds-friends');
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
        for (let item of (data.content || data)) {
          var cell = document.createElement('div');
          cell.className = 'grid-cell user-card';
          var link = document.createElement('a');
          link.className = 'card-link';
          link.target = '_blank';
          link.rel = 'external nofollow noopener noreferrer';
          link.href = item.html_url || item.url || '#';
          var img = document.createElement('img');
          img.src = item.avatar_url || item.avatar || item.icon || default_avatar;
          img.setAttribute('onerror', "this.removeAttribute('data-src');this.src='" + default_avatar + "';");
          link.appendChild(img);
          var nameDiv = document.createElement('div');
          nameDiv.className = 'name image-meta';
          var caption = document.createElement('span');
          caption.className = 'image-caption';
          caption.textContent = item.title || item.login || '';
          nameDiv.appendChild(caption);
          link.appendChild(nameDiv);
          if (item.labels && item.labels.length > 0) {
            let label = item.labels[0];
            var labelDiv = document.createElement('div');
            labelDiv.className = 'label';
            labelDiv.style.backgroundColor = '#' + label.color;
            labelDiv.textContent = label.name || '';
            link.appendChild(labelDiv);
          }
          cell.appendChild(link);
          $(el).find('.grid-box').append(cell);
        }
        window.wrapLazyloadImages(el);
      });
    }
  });
});