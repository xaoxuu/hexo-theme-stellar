const loadMarkdown = (cfg) => {
  if (!window.fetch) {
    cfg.el.innerHTML =
      '<div style="font-size: 24px"><p>Your browser outdated. Please use the latest version of Chrome or Firefox!</p><p>您的浏览器版本过低，请使用最新版的 Chrome 或 Firefox 浏览器！</p></div>';
  } else {
    cfg.el.innerHTML =
      '<div class="loading-wrap"><svg xmlns="http://www.w3.org/2000/svg" width="2em" height="2em" preserveAspectRatio="xMidYMid meet" viewBox="0 0 24 24"><g fill="none" stroke="currentColor" stroke-linecap="round" stroke-width="2"><path stroke-dasharray="60" stroke-dashoffset="60" stroke-opacity=".3" d="M12 3C16.9706 3 21 7.02944 21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3Z"><animate fill="freeze" attributeName="stroke-dashoffset" dur="1.3s" values="60;0"/></path><path stroke-dasharray="15" stroke-dashoffset="15" d="M12 3C16.9706 3 21 7.02944 21 12"><animate fill="freeze" attributeName="stroke-dashoffset" dur="0.3s" values="15;0"/><animateTransform attributeName="transform" dur="1.5s" repeatCount="indefinite" type="rotate" values="0 12 12;360 12 12"/></path></g></svg></div>';
    fetch(cfg.src, { method: "GET" })
      .then((resp) => {
        return Promise.all([
          resp.ok,
          resp.status,
          resp.text(),
          resp.headers,
        ]);
      })
      .then(([ok, status, data, headers]) => {
        if (ok) {
          return {
            ok,
            status,
            data,
            headers,
          };
        } else {
          throw new Error(JSON.stringify(json.error));
        }
      })
      .then((resp) => {
        let data = marked.parse(resp.data);
        cfg.el.innerHTML = data;
      })
      .catch((error) => {
        console.error(error);
        cfg.el.innerHTML =
          '<div class="loading-wrap error"><svg xmlns="http://www.w3.org/2000/svg" width="2em" height="2em" preserveAspectRatio="xMidYMid meet" viewBox="0 0 24 24"><g fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2"><path stroke-dasharray="60" stroke-dashoffset="60" d="M12 3L21 20H3L12 3Z"><animate fill="freeze" attributeName="stroke-dashoffset" dur="0.5s" values="60;0"/></path><path stroke-dasharray="6" stroke-dashoffset="6" d="M12 10V14"><animate fill="freeze" attributeName="stroke-dashoffset" begin="0.6s" dur="0.2s" values="6;0"/></path></g><circle cx="12" cy="17" r="1" fill="currentColor" fill-opacity="0"><animate fill="freeze" attributeName="fill-opacity" begin="0.8s" dur="0.4s" values="0;1"/></circle></svg></div>';
      });
  };
};

$(function () {
  const els = document.getElementsByClassName('stellar-marked-api');
  for (var i = 0; i < els.length; i++) {
    var cfg = new Object();
    const el = els[i];
    cfg.src = `${el.getAttribute('src')}?t=${new Date().getTime()}`;
    cfg.el = el;
    loadMarkdown(cfg);
  }
});
