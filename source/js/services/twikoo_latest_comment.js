utils.jq(() => {
    $(function () {
      const el = document.querySelector('.ds-twikoo');
      utils.onLoading(el); // 加载动画
  
      const api = el.dataset.api;
      const limit = parseInt(el.getAttribute('limit')) || 10;
      const reply = el.getAttribute('hide') !== 'reply';
      if (!api) return;
  
      fetch(api, {
        method: "POST",
        body: JSON.stringify({
          "event": "GET_RECENT_COMMENTS",
          "envId": api,
          "pageSize": limit,
          "includeReply": reply
        }),
        headers: { 'Content-Type': 'application/json' }
      })
      .then(res => res.json())
      .then(({ data }) => {
        utils.onLoadSuccess(el); // 移除动画
        data.forEach((comment, j) => {
          let commentText = comment.commentText;
          if (!commentText || commentText.trim() === '') return; // 跳过空评论
          // 转义字符
          commentText = commentText.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#039;");
          commentText = commentText.length > 50 ? commentText.substring(0, 50) + '...' : commentText;
          var cell = '<div class="timenode" index="' + j + '">';
          cell += '<div class="header">';
          cell += '<div class="user-info">';
          cell += '<span>' + comment.nick + '</span>';
          cell += '</div>';
          cell += '<span>' + new Date(comment.created).toLocaleString('zh-CN', {month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hour12: false}) + '</span>';
          cell += '</div>';
          cell += '<a class="body" href="' + comment.url + '#' + comment.id + '">';
          cell += commentText;
          cell += '</a>';
          cell += '</div>';
          $(el).append(cell);
        });
      })
      .catch(() => utils.onLoadFailure(el));
    });
  });
  