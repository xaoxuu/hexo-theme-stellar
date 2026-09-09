// 本插件由CardLink定制而成，原项目源码: https://github.com/Lete114/CardLink
function setCardLink(nodes, signal) {
  // If the `nodes` do not contain a `forEach` method, then the default `a[cardlink]` is used
  nodes = 'forEach' in (nodes || {}) ? nodes : document.querySelectorAll('a[cardlink]')
  nodes.forEach((el) => {
    // If it is not a tag element then it is not processed
    if (el.nodeType !== 1) return;
    el.removeAttribute('cardlink');
    const api = el.dataset.api;
    if (api == null) return;
    // 走统一请求入口，数据缓存对 siteinfo 同样生效
    utils.request(null, api, function(response) {
      return response.json().then(function(data) {
        if (signal?.aborted) return;
        var autofill = [];
        const autofillStr = el.getAttribute('autofill');
        if (autofillStr) {
          autofill = autofillStr.split(',');
        }
        if (data.title && data.title.length > 0 && autofill.includes('title')) {
          el.querySelector('.title').innerHTML = data.title;
          el.title = data.title;
        }
        if (data.icon && data.icon.length > 0 && autofill.includes('icon')) {
          el.querySelector('.img').style = 'background-image: url("' + data.icon + '");';
          el.querySelector('.img').setAttribute('data-bg', data.icon);
        }
        let desc = el.querySelector('.desc');
        if (desc && data.desc && data.desc.length > 0 && autofill.includes('desc')) {
          desc.innerHTML = data.desc;
        }
      });
    }, undefined, { service: 'siteinfo', signal }).catch(function() {});
  })
}

function setMdLinkIcon(nodes, signal) {
  nodes.forEach((el) => {
    utils.request(null, el.dataset.siteinfoApi, function(response) {
      return response.json().then(function(data) {
        if (signal?.aborted) return;
        if (signal?.aborted || typeof data.icon !== 'string' || !data.icon) return;
        let url;
        try { url = new URL(data.icon, el.href); } catch { return; }
        if (!['http:', 'https:'].includes(url.protocol)) return;
        const image = new Image();
        image.alt = '';
        image.onload = function() {
          if (signal?.aborted || !el.isConnected) return;
          el.querySelector('.md-link-icon')?.replaceChildren(image);
        };
        image.src = url.href;
      });
    }, undefined, { service: 'siteinfo', signal }).catch(function() {});
  });
}

function setSiteCardIcon(nodes, signal) {
  nodes = 'forEach' in (nodes || {}) ? nodes : document.querySelectorAll('.site-card .card-link[data-siteinfo-api]')
  nodes.forEach((el) => {
    if (el.nodeType !== 1) return;
    const api = el.dataset.siteinfoApi;
    if (api == null) return;
    utils.request(null, api, function(response) {
      return response.json().then(function(data) {
        if (signal?.aborted) return;
        if (data.icon && data.icon.length > 0) {
          const icon = el.querySelector('.siteinfo-icon');
          if (icon) {
            icon.src = data.icon;
            icon.setAttribute('data-src', data.icon);
          }
        }
      });
    }, undefined, { service: 'siteinfo', signal }).catch(function() {});
  })
}
