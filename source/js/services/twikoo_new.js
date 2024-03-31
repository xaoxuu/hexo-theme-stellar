utils.jq(() => {
    // 在加载 Twikoo 脚本前显示加载动画
    const twikoos = document.getElementsByClassName('ds-twikoo');
    for (var i = 0; i < twikoos.length; i++) {
        utils.onLoading(twikoos[i]);
    }
    utils.js('https://npm.onmicrosoft.cn/twikoo@1.6.32', {async: true}).then(function () {
        // 当 Twikoo 脚本加载完成后执行加载评论的函数
        $(function () {
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
                    // 加载成功，移除加载动画
                    utils.onLoadSuccess(el);
                    for (var j = 0; j < res.length; j++) {
                        var commentText = res[j].commentText;
                        // 跳过空评论或截断超过50个字符的评论
                        if (!commentText || commentText.trim() === '') {
                            continue;
                        } else if (commentText.length > 50) {
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
                }).catch(function () {
                    utils.onLoadFailure(el);
                });
            }
        });
    }).catch(function () {
        for (var i = 0; i < twikoos.length; i++) {
            utils.onLoadFailure(twikoos[i]);
        }
    });
});
