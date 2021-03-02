const IssuesAPI = {
  requestIssuesAPI(url, callback, timeout) {
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
  getIssuesAPIForFriends(cfg) {
    const el = $(cfg.el)[0];
    $(el).append('<div class="loading"><p>正在加载</p></div>');
    this.requestIssuesAPI(cfg.api, function(data) {
      $(el).find('.loading').remove();
      const arr = data.content;
      arr.forEach((item, i) => {
        var user = '<div class="user-simple">';
        user += '<a class="user-link" target="_blank" rel="external nofollow noopener noreferrer"';
        user += ' href="' + item.url + '">';
        user += '<img src="' + item.avatar + '" onerror="javascript:this.src=\'https://image.thum.io/get/width/1024/crop/768/' + item.url + '\';"/>';
        user += '<div class="name"><span>' + item.title + '</span></div>';
        user += '</a>';
        user += '</div>';
        $(el).find('.group-body').append(user);
      });
    }, function() {
      $(el).find('.loading i').remove();
      $(el).find('.loading p').text('加载失败，请稍后重试。');
    });
  },
  request() {
    const els = document.getElementsByClassName('issues-wrap');
    for (var i = 0; i < els.length; i++) {
      const el = els[i];
      const api = el.getAttribute('api');
      const group = el.getAttribute('group');
      if (api == null) {
        continue;
      }
      var cfg = new Object();
      cfg.class = el.getAttribute('class');
      cfg.el = el;
      cfg.api = api;
      cfg.group = group;
      this.getIssuesAPIForFriends(cfg);
    }
  }
};
$(function () {
  IssuesAPI.request();
});
