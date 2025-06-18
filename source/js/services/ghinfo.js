utils.jq(() => {
  $(function () {
    const els = document.getElementsByClassName('ds-ghinfo');
    for (var i = 0; i < els.length; i++) {
      const el = els[i];
      const api = el.getAttribute('api');
      if (api == null) {
        continue;
      }
      // layout
      utils.request(null, api, function(data) {
        function fill(data) {
          for (let key of Object.keys(data)) {
            $(el).find("[type=text]#" + key).text(data[key]);
            $(el).find("[type=link]#" + key).attr("href", data[key]);
            $(el).find("[type=img]#" + key).attr("src", data[key]);
          }
        }
        const idx = el.getAttribute('index');
        if (idx != undefined) {
          const arr = data.content || data;
          if (arr && arr.length > idx) {
            let obj = arr[idx];
            obj['latest-tag-name'] = obj['name'];
            fill(arr[idx]);
          }
        } else {
          fill(data);
        }
      });
    }
  });
});