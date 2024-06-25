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

      // 定义成功和失败的回调函数
      function onSuccess(data) {
        var memos = data.memos;
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
        memos.forEach((item, i) => {
          if (limit && i >= limit) {
            return;
          }
          if (item.creator && users.length > 0) {
            if (!users.includes(item.creator)) {
              return;
            }
          }
          let date = new Date(item.createTime);
          var cell = '<div class="timenode" index="' + i + '">';
          cell += '<div class="header">';
          if (!users.length && !hide.includes('user')) {
            cell += '<div class="user-info">';
            if (default_avatar.length > 0) {
              cell += `<img src="${default_avatar}">`;
            }
            cell += '<span>' + item.creator + '</span>';
            cell += '</div>';
          }
          cell += '<span>' + date.toLocaleString() + '</span>';
          cell += '</div>';
          cell += '<div class="body">';
          cell += marked.parse(item.content || '');
          var imgs = [];
          for (let res of item.resources) {
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
                // 使用正确的图片地址
                const memoId = img.memo.split('/')[1];
                cell += `<div class="image-bg"><img src="https://memos.sakurasep.site/file/resources/${memoId}/${img.filename}" data-fancybox="memos"></div>`;
              }
            }
            cell += '</div>';
          }
          cell += '</div>';
          cell += '</div>';
          $(el).append(cell);
        });
      }

      function onFailure(error) {
        console.error('Failed to fetch data:', error);
      }

      // 发送请求
      utils.request(el, api, onSuccess, onFailure);
    }
  });
});

// 示例异步请求函数
utils.request = function(el, api, onSuccess, onFailure) {
  fetch(api)
      .then(response => {
        if (!response.ok) {
          throw new Error('Network response was not ok');
        }
        return response.json();
      })
      .then(data => {
        onSuccess(data); // 成功回调
      })
      .catch(error => {
        if (typeof onFailure === 'function') {
          onFailure(error); // 失败回调
        } else {
          console.error('Error fetching data:', error);
        }
      });
}
