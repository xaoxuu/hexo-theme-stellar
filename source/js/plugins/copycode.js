function createCopyButtons(codeElements) {
  codeElements.forEach((codeElement) => {
    if (codeElement.querySelector('.copy-btn')) return;
    // 创建复制按钮
    const codeCopyBtn = document.createElement('div');
    codeCopyBtn.className = 'copy-btn';
    codeCopyBtn.textContent = ctx.copycode.default_text;
    codeElement.appendChild(codeCopyBtn);

    // 添加点击事件监听
    codeCopyBtn.addEventListener('click', async () => {
      const codeToCopy = codeElement.querySelector('pre')?.innerText || '';
      if (navigator.clipboard) {
        try {
          await navigator.clipboard.writeText(codeToCopy);
          codeCopyBtn.textContent = ctx.copycode.success_text;
          codeCopyBtn.classList.add('success');
          hud.toast(ctx.copycode.toast, 2500);
        } catch (error) {
          codeCopyBtn.textContent = '未获得用户许可';
          codeCopyBtn.classList.add('warning');
        }
      } else {
        codeCopyBtn.textContent = '浏览器不支持/非HTTPS';
        codeCopyBtn.classList.add('warning');
      }

      // 3秒后恢复默认文本
      setTimeout(() => {
        codeCopyBtn.textContent = ctx.copycode.default_text;
        codeCopyBtn.classList.remove('success', 'warning');
      }, 3000);
    });
  });
}

if (typeof window.codeElements !== 'undefined') {
  createCopyButtons(window.codeElements);
}