utils.jq(() => {
  const twikoos = document.getElementsByClassName('ds-twikoo');
  Array.from(twikoos).forEach(el => utils.onLoading(el)); //加载动画

  utils.js('https://npm.onmicrosoft.cn/twikoo@1.6.32', { async: true }).then(() => {
    $(() => {
      for (let el of twikoos) {
        const api = el.getAttribute('api');
        const limit = parseInt(el.getAttribute('limit')) || 10;
        const reply = el.getAttribute('hide') !== 'reply';
        if (!api) continue;
        twikoo.getRecentComments({ //获取评论
          envId: api,
          pageSize: limit,
          includeReply: reply
        }).then(res => {
          utils.onLoadSuccess(el); //移除动画
          res.forEach((comment, j) => {
            let commentText = comment.commentText;
            if (!commentText) return;
            // 转义
            commentText = commentText.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#039;");
            commentText = commentText.length > 50 ? commentText.substring(0, 50) + '...' : commentText;
            var cell = '<div class="timenode" index="' + j + '">';
            cell += '<div class="header">';
            cell += '<div class="user-info">';
            cell += '<span>' + comment.nick + '</span>';
            cell += '</div>';
            cell += '<span>' + comment.relativeTime + '</span>';
            cell += '</div>';
            cell += '<a class="body" href="' + comment.url + '">';
            cell += commentText;
            cell += '</a>';
            cell += '</div>';
            $(el).append(cell);
          });
        }).catch(() => utils.onLoadFailure(el));
      }
    });
  }).catch(() => Array.from(twikoos).forEach(el => utils.onLoadFailure(el)));
});
