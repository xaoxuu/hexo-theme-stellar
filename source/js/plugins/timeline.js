const StellarTimeline = {
  reactions: {
    '+1': '👍',
    '-1': '👎', 
    'laugh': '😀', 
    'hooray': '🎉', 
    'confused': '😕', 
    'heart': '❤️', 
    'rocket': '🚀', 
    'eyes': '👀'
  },
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
      arr.forEach((item, i) => {
        var cell = '<div class="timenode" index="' + i + '">';
        cell += '<div class="header">';
        let date = new Date(item.created_at);
        cell += '<p>' + date.toString().replace(/\sGMT([^.]*)/i, "") + '</p>';
        cell += '</div>';
        cell += '<div class="body">';
        cell += '<p class="title">';
        cell += '<a href="' + item.html_url + '" target="_blank" rel="external nofollow noopener noreferrer">';
        cell += item.title || item.name || item.tag_name;
        cell += '</a>';
        cell += '</p>';
        
        cell += marked.parse(item.body);
        cell += '<div class="footer">';
        cell += '<div class="flex left">';
        if (item.labels) {
          item.labels.forEach((label, i) => {
            cell += '<div class="item label ' + label.name + '" style="background:#' + label.color + '18;border-color:#' + label.color + '36">';
            cell += '<span>' + label.name + '</span>';
            cell += '</div>';
          });
        } else if (item.zipball_url) {
          cell += '<a class="item download" href="' + item.zipball_url + '" target="_blank" rel="external nofollow noopener noreferrer">';
          cell += '<span>📦 ' + item.tag_name + '.zip</span>';
          cell += '</a>';
        }
        cell += '</div>';
        cell += '<div class="flex right">';
        if (item.reactions && item.reactions.total_count > 0) {
          for (let key of Object.keys(StellarTimeline.reactions)) {
            let num = item.reactions[key];
            if (num > 0) {
              cell += '<div class="item reaction ' + key + '">';
              cell += '<span>' + StellarTimeline.reactions[key] + ' ' + item.reactions[key] + '</span>';
              cell += '</div>';
            }
          }
        }
        if (item.comments) {
          cell += '<a class="item comments last" href="' + item.html_url + '" target="_blank" rel="external nofollow noopener noreferrer">';
          cell += '<span>💬 ' + item.comments + '</span>';
          cell += '</a>';
        }
        
        cell += '</div>';
        cell += '</div>';
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
