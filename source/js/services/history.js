utils.jq(() => {
    $(function () {
        let now = new Date();
        let year = now.getFullYear();
        let month = String(now.getMonth() + 1).padStart(2, '0');
        let date = String(now.getDate()).padStart(2, '0');
        let currentDate = month + '月' + date + '日';
        console.log(currentDate);
        const els = document.getElementsByClassName('ds-history');
        for (var i = 0; i < els.length; i++) {
            const el = els[i];
            const api = el.getAttribute('api');
            if (api == null) {
                continue;
            }
            // layout
            utils.request(el, api, function (data) {
                const list = data.data.list || [];
                const limit = el.getAttribute('limit') || list.length;
                let currentIndex = 0;
                const displayItem = function () {
                    const item = list[currentIndex];
                    var cell = '<div class="timenode" id="historyDisplay" index="' + currentIndex + '">';
                    cell += '<div class="header">';
                    cell += '<div class="user-info">';
                    cell += '<span>' + item.year + '年' + '</span>';
                    cell += '</div>';
                    cell += '<span>' + currentDate + '</span>';
                    cell += '</div>';
                    cell += '<a class="body" href="' + item.url + '" target="_blank" rel="external nofollow noopener noreferrer">';
                    cell += item.title;
                    cell += '</a>';
                    cell += '</div>';
                    $(el).html(cell);
                    currentIndex = (currentIndex + 1) % limit;
                };
                displayItem();
                setInterval(displayItem, 10000);
            });
        }
    });
});