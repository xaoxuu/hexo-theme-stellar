utils.jq(() => {
    // 加载 Twikoo 的 JavaScript 脚本
    const twikooScript = document.createElement('script');
    twikooScript.src = 'https://npm.onmicrosoft.cn/twikoo@1.6.32';
    twikooScript.async = true;
    document.head.appendChild(twikooScript);

    twikooScript.onload = function() {
        // 当 Twikoo 脚本加载完成后执行加载评论的函数
        $(function () {
            const twikoos = document.getElementsByClassName('ds-twikoo');
            for (var i = 0; i < twikoos.length; i++) {
                const el = twikoos[i];
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
                        var commentText = res[j].commentText;
                        // 检查 commentText 的长度并截断超过 50 个字符的文本
                        if (commentText.length > 50) {
                            commentText = commentText.substring(0, 50) + '...';
                        }
                        var cell = '<div class="timenode" index="' + j + '">';
                        cell += '<div class="header">';
                        cell += '<div class="user-info">';
                        cell += '<span>' + res[j].nick + '</span>';
                        cell += '</div>';
                        cell += '<span>' + res[j].relativeTime + '</span>';
                        cell += '</div>';
                        cell += '<a class="body" href="' + res[j].url + '">';
                        cell += commentText;
                        cell += '</a>';
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
