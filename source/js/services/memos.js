utils.jq(() => {
  const els = Array.from(document.getElementsByClassName('ds-memos'));

  els.forEach(el => {
    const api = el.dataset.api;
    if (!api) return;

    const default_avatar = el.getAttribute('avatar') || def.avatar;
    const limit = el.getAttribute('limit');
    const host = api.match(/https:\/\/(.*?)\/(.*)/i)[1];

    utils.request(el, api, async resp => {
      const data = await resp.json();
      let memos = versionHandlers.identify(data);
      if (memos.version === "feature" )return;

      const users = el.getAttribute('user')?.split(",") || [];
      const hide = el.getAttribute('hide')?.split(",") || [];

      await Promise.all(memos.data.slice(0, limit || memos.data.length).map(item =>
          createMemoCell(item, memos, users, hide, default_avatar, host).then(cell => $(el).append(cell))
      ));
    });

    async function createMemoCell(item, memos, users, hide, default_avatar, host) {
      const versionHandler = versionHandlers[memos.version] || versionHandlers["feature"];
      return `<div class="timenode">
                      <div class="header">${!users.length && !hide.includes('user') ? await versionHandler.buildUser(item, memos, default_avatar) : ''}
                      <span>${versionHandler.buildDate(item).toLocaleString()}</span></div>
                      <div class="body">${marked.parse(item.content || '')}
                      <p>${versionHandler.buildImages(item, host).join('')}</p>
                      </div></div>`;
    }

    // Memos版本管理
    const versionHandlers = {
      "22-": {
        buildUser: async (item, memos, default_avatar) =>
            `<div class="user-info">${default_avatar ? `<img src="${default_avatar}">` : ''}<span>${item.creatorName}</span></div>`,
        buildDate: item => new Date(item.createdTs * 1000),
        buildImages: (item, host) => (item.resourceList || []).filter(res => res.type?.includes('image/')).map(res =>
            `<p><img src="${res.externalLink || `https://${host}/o/r/${res.id}`}"></p>`
        )
      },
      "22+": {
        buildUser: async (item, memos, default_avatar) => {
          const creatorId = item?.creator.split('/')[1];
          let user = memos.users.find(user => user.id === parseInt(creatorId));
          if (!user) {
            if (!memos.requests[creatorId]) {
              memos.requests[creatorId] = fetch(`${memos.site}/api/v1/users/${creatorId}`)
                  .then(response => response.json())
                  .then(data => {
                    if (data.username) {
                      user = data;
                      memos.users.push(data);
                    } else {
                      user = null;
                    }
                  })
                  .finally(() => delete memos.requests[creatorId]);
            }
            await memos.requests[creatorId];
            user = memos.users.find(user => user.id === parseInt(creatorId));
          }
          const name = user ? user.nickname || user.username : 'memos';
          const avatarUrl = user?.avatarUrl ? `${memos.site}${user.avatarUrl}` : default_avatar || '';
          return `<div class="user-info">${avatarUrl ? `<img src="${avatarUrl}">` : ''}<span>${name}</span></div>`;
        },
        buildDate: item => new Date(item.createTime),
        buildImages: (item) => (item.resources || []).filter(res => res.type?.includes('image/')).map(res =>
            `<p><img src="${res.externalLink || `https://${host}/o/r/${res.id}`}"></p>`
        )
      },
      "feature": {
        buildUser: async () => "memos",
        buildDate: () => new Date(),
        buildImages: () => []
      },
      identify: (data) => {
        let memos = { version: "feature", users: [], site: api.split('/api/v1')[0], requests: {}, data: [] }
        if (Array.isArray(data)) {
          memos.version = "22-";
          memos.data = data;
        } else if (data.memos) {
          memos.version = "22+";
          memos.data = data.memos;
        } else {
          memos.version = "feature";
          console.log("当前Memos版本过高，请到Stellar社区反馈");
        }
        return memos
      }
    };
  });
});
