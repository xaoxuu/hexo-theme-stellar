const MemosJS = {
  requestAPI: (url, callback, timeout) => {
    let retryTimes = 5;
    function request() {
      return new Promise((resolve, reject) => {
        let status = 0; // 0 等待 1 完成 2 超时
        let timer = setTimeout(() => {
          if (status === 0) {
            status = 2;
            timer = null;
            reject('请求超时');
            if (retryTimes == 0) {
              timeout();
            }
          }
        }, 5000);
        fetch(url).then(function(response) {
          if (status !== 2) {
            clearTimeout(timer);
            resolve(response);
            timer = null;
            status = 1;
          }
          if (response.ok) {
            return response.json();
          }
          throw new Error('Network response was not ok.');
        }).then(function(data) {
          retryTimes = 0;
          callback(data);
        }).catch(function(error) {
          if (retryTimes > 0) {
            retryTimes -= 1;
            setTimeout(() => {
              request();
            }, 5000);
          } else {
            timeout();
          }
        });
      });
    }
    request();
  },
  layoutDiv: (cfg) => {
    const el = $(cfg.el)[0];
    $(el).append('<div class="loading-wrap"><svg xmlns="http://www.w3.org/2000/svg" width="2em" height="2em" preserveAspectRatio="xMidYMid meet" viewBox="0 0 24 24"><g fill="none" stroke="currentColor" stroke-linecap="round" stroke-width="2"><path stroke-dasharray="60" stroke-dashoffset="60" stroke-opacity=".3" d="M12 3C16.9706 3 21 7.02944 21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3Z"><animate fill="freeze" attributeName="stroke-dashoffset" dur="1.3s" values="60;0"/></path><path stroke-dasharray="15" stroke-dashoffset="15" d="M12 3C16.9706 3 21 7.02944 21 12"><animate fill="freeze" attributeName="stroke-dashoffset" dur="0.3s" values="15;0"/><animateTransform attributeName="transform" dur="1.5s" repeatCount="indefinite" type="rotate" values="0 12 12;360 12 12"/></path></g></svg></div>');
    MemosJS.requestAPI(cfg.api, function(data) {
      $(el).find('.loading-wrap').remove();
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
        if (cfg.limit && i >= cfg.limit) {
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
          if (cfg.avatar?.length > 0) {
            cell += `<img src="${cfg.avatar}">`;
          }
          cell += '<span>' + item.creatorName + '</span>';
          cell += '</div>';
        }
        cell += '<p>' + date.toLocaleString() + '</p>';
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
              cell += `<div class="image-bg"><img src="${img.externalLink}" fancybox="true"></div>`;
            } else {
              cell += `<div class="image-bg"><img src="https://${cfg.host}/o/r/${img.id}" fancybox="true"></div>`;
            }
            
          }
          cell += '</div>';
        }
        cell += '</div>';
        cell += '</div>';
        $(el).append(cell);
      });
    }, function() {
      $(el).find('.loading-wrap svg').remove();
      $(el).find('.loading-wrap').append('<svg xmlns="http://www.w3.org/2000/svg" width="2em" height="2em" preserveAspectRatio="xMidYMid meet" viewBox="0 0 24 24"><g fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2"><path stroke-dasharray="60" stroke-dashoffset="60" d="M12 3L21 20H3L12 3Z"><animate fill="freeze" attributeName="stroke-dashoffset" dur="0.5s" values="60;0"/></path><path stroke-dasharray="6" stroke-dashoffset="6" d="M12 10V14"><animate fill="freeze" attributeName="stroke-dashoffset" begin="0.6s" dur="0.2s" values="6;0"/></path></g><circle cx="12" cy="17" r="1" fill="currentColor" fill-opacity="0"><animate fill="freeze" attributeName="fill-opacity" begin="0.8s" dur="0.4s" values="0;1"/></circle></svg>');
      $(el).find('.loading-wrap').addClass('error');
    });
  },
}

$(function () {
  const els = document.getElementsByClassName('stellar-memos-api');
  for (var i = 0; i < els.length; i++) {
    const el = els[i];
    const api = el.getAttribute('api');
    if (api == null) {
      continue;
    }
    var cfg = new Object();
    cfg.el = el;
    cfg.api = api;
    cfg.limit = el.getAttribute('limit');
    cfg.host = api.replace(/https:\/\/(.*?)\/(.*)/i, '$1');
    cfg.avatar = el.getAttribute('avatar');
    if (!cfg.avatar) {
      cfg.avatar = 'https://gcore.jsdelivr.net/gh/cdn-x/placeholder@1.0.12/avatar/round/3442075.svg';
    }
    MemosJS.layoutDiv(cfg);
  }
});
