(function () {
  const els = document.getElementsByClassName('ds-ghinfo');
    for (var i = 0; i < els.length; i++) {
      const el = els[i];
      const api = el.dataset.api;
      if (api == null) {
        continue;
      }
      const isWikiStars = el.classList.contains('wiki-stars');
      const isWikiRelease = el.classList.contains('wiki-cover-release');
      // layout
      utils.request(isWikiStars ? el : null, api, async resp => {
        const data = await resp.json();
        function fill(data) {
          for (let key of Object.keys(data)) {
            utils.dom(el).find("[type=text]#" + key).text(data[key]);
            utils.dom(el).find("[type=link]#" + key).attr("href", data[key]);
            utils.dom(el).find("[type=img]#" + key).attr("src", data[key]);
          }
        }
        const idx = el.getAttribute('index');
        const arr = data.content || data;
        if (idx != undefined) {
          if (arr && arr.length > idx) {
            let obj = arr[idx];
            obj['latest-tag-name'] = obj['name'];
            fill(arr[idx]);
          }
        } else {
          fill(data);
        }
        if (isWikiStars && data.stargazers_count != null) {
          el.classList.add('loaded');
        }
        if (isWikiRelease) {
          const tag = el.querySelector('#latest-tag-name');
          if (tag && tag.textContent) {
            const value = el.querySelector('.wiki-cover-release-value');
            const item = arr && arr.length > idx ? arr[idx] : data;
            const repo = el.dataset.repo;
            const url = item && item.html_url || repo && 'https://github.com/' + repo.split('/').map(encodeURIComponent).join('/') + '/tree/' + encodeURIComponent(tag.textContent);
            if (!url) {
              el.remove();
              return;
            }
            value.textContent = el.dataset.projectName + ' ' + tag.textContent;
            el.href = url;
            el.classList.remove('is-loading');
            el.classList.add('loaded');
          } else {
            el.remove();
          }
        }
      }, () => {
        if (isWikiStars || isWikiRelease) {
          el.remove();
        }
      }).catch(() => {});
    }
})();
