const StellarTimeline = {
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
    $(el).append('<div class="loading-wrap"><svg class="loading" style="vertical-align: middle;fill: currentColor;overflow: hidden;" viewBox="0 0 1024 1024" version="1.1" xmlns="http://www.w3.org/2000/svg" p-id="2709"><path d="M832 512c0-176-144-320-320-320V128c211.2 0 384 172.8 384 384h-64zM192 512c0 176 144 320 320 320v64C300.8 896 128 723.2 128 512h64z" p-id="2710"></path></svg><p></p></div>');
    StellarTimeline.requestAPI(cfg.api, function(data) {
      $(el).find('.loading-wrap').remove();
      const arr = data.content || data;
      const reversed = el.getAttribute('reversed');
      if (reversed == '' || reversed == true) {
        arr.reverse();
      }
      arr.forEach((item, i) => {
        var cell = '<div class="timenode" index="' + i + '">';
        cell += '<div class="header">';
        cell += '<p>' + item.title + '</p>';
        cell += '</div>';
        cell += '<div class="body fs14">';
        cell += marked.parse(item.body);
        cell += '</div>';
        cell += '</div>';
        $(el).append(cell);
      });
    }, function() {
      $(el).find('.loading-wrap svg').remove();
      $(el).find('.loading-wrap p').text('加载失败，请稍后重试。');
    });
  },
}

$(function () {
  const els = document.getElementsByClassName('stellar-timeline-api');
  for (var i = 0; i < els.length; i++) {
    const el = els[i];
    const api = el.getAttribute('api');
    if (api == null) {
      continue;
    }
    var obj = new Object();
    obj.el = el;
    obj.api = api;
    StellarTimeline.layoutDiv(obj);
  }
});
