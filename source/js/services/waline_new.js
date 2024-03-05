// import axios from 'axios'; // 假设您已经在项目中引入了 Axios 库，用于发起 AJAX 请求
// var marked = require('marked');

utils.jq(() => {
    $(function () {
        const els = document.getElementsByClassName('ds-commentnew');
        for (var i = 0; i < els.length; i++) {
            const el = els[i];
            const api = el.getAttribute('api');
            const limit = parseInt(el.getAttribute('limit')) || 10;

            if (!api) {
                continue;
            }

            // 使用 Axios 发起 GET 请求获取 JSON 数据
            axios.get(api + '/comment?type=recent&count=' + limit)
                .then((response) => {
                    const res = response.data;
                    console.log(res);
                    for (var j = 0; j < res.length; j++) {
                        // console.log(res[j].insertedAt);
                        // console.log(res[j].comment);
                        // console.log(markdownCell);

                        var cell = '<div class="timenode" index="' + i + '">';
                        cell += '<div class="header">';
                        cell += '<div class="user-info">';
                        cell += '<span>' + res[j].nick + '</span>';
                        cell += '</div>';
                        cell += '<span>' + new Date(res[j].insertedAt).toLocaleString() + '</span>';
                        cell += '</div>';
                        cell += '<a class="body" href="' + (res[j].link || '#') + '" target="_blank" rel="external nofollow noopener noreferrer">';
                        cell += '<span>';
                        // cell += res[j].orig;
                        cell += res[j].comment.replace(/<a\b[^>]*>(.*?)<\/a>/g, '$1');
                        // cell += markdownCell;
                        cell += '</span>';
                        cell += '</a>';
                        cell += '</div>';
                        $(el).append(cell);
                    }
                })
                .catch(function (err) {
                    // 发生错误
                    console.error(err);
                });
        }
    });
});
