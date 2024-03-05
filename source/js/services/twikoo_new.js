utils.jq(() => {
    // 加载 Twikoo 的 JavaScript 脚本
    const twikooScript = document.createElement('script');
    twikooScript.src = 'https://npm.onmicrosoft.cn/twikoo@1.6.31';
    twikooScript.async = true;
    document.head.appendChild(twikooScript);

    twikooScript.onload = function() {
        // 当 Twikoo 脚本加载完成后执行加载评论的函数
        $(function () {
            const twikoo = document.getElementsByClassName('ds-twikoo');
            for (var i = 0; i < twikoo.length; i++) {
                const el = twikoo[i];
                const api = el.getAttribute('api');
                const limit = parseInt(el.getAttribute('limit')) || 10;
                const reply = el.getAttribute('hide') === 'reply' ? false : true;
                if (api == null) {
                    continue;
                }
                twikoo.getRecentComments({
                    envId: api,
                    pageSize: limit,
                    includeReply: reply
                }).then(function (res) {
                    for (var j = 0; j < res.length; j++) {
                        var cell = '<div class="timenode" index="' + i + '">';
                        cell += '<div class="header">';
                        cell += '<div class="user-info">';
                        cell += '<span>' + res[j].nick + '</span>';
                        cell += '</div>';
                        cell += '<span>' + res[j].relativeTime + '</span>';
                        cell += '</div>';
                        cell += '<a class="body" href="' + res[j].url + '" target="_blank" rel="external nofollow noopener noreferrer">';
                        cell += res[j].commentText;
                        cell += '</div>';
                        cell += '</div>';
                        $(el).append(cell);
                    }
                }).catch(function (err) {
                    // 发生错误
                    console.error(err);
                });
            }
        });
    };
});
