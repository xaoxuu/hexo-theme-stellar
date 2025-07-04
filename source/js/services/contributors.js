utils.jq(() => {
  $(function () {
    function parseGithubFileContributors(data) {
      // 去重贡献者（按 login）
      const contributorsMap = new Map();

      for (const commit of data) {
        const author = commit.author;
        if (author) {
          const login = author.login;
          if (!contributorsMap.has(login)) {
            contributorsMap.set(login, {
              login: login,
              avatar_url: author.avatar_url,
              html_url: author.html_url,
              count: 1
            });
          } else {
            contributorsMap.get(login).count++;
          }
        }
      }
      // 转为数组并按提交次数排序（降序）
      const sortedContributors = Array.from(contributorsMap.values())
        .sort((a, b) => b.count - a.count);
      return sortedContributors;
    }

    const els = document.getElementsByClassName('ds-contributors');
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
        const list = parseGithubFileContributors(data);
        for (let item of list) {
          var cell = `<div class="grid-cell user-card">`;
          cell += `<a class="card-link" target="_blank" rel="external nofollow noopener noreferrer" href="${item.html_url || item.url}">`;;
          cell += `<img src="${item.avatar_url || item.avatar || item.icon || default_avatar}" onerror="javascript:this.removeAttribute(\'data-src\');this.src=\'${default_avatar}\';"/>`;
          cell += `<div class="name image-meta">`;
          cell += `<span class="image-caption">${item.title || item.login}</span>`;
          cell += `</div>`;
          cell += `</a>`;
          cell += `</div>`;
          $(el).find('.grid-box').append(cell);
        }
        window.wrapLazyloadImages(el);
      });
    }
  });
});