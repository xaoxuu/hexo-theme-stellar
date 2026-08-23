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
          hud.toast(ctx.copycode.toast, ctx.copycode.toast_ms);
        } catch (error) {
          codeCopyBtn.textContent = ctx.copycode.denied_text;
          codeCopyBtn.classList.add('warning');
        }
      } else {
        codeCopyBtn.textContent = ctx.copycode.unsupported_text;
        codeCopyBtn.classList.add('warning');
      }

      // 固定反馈时序由内部 Runtime policy 提供。
      setTimeout(() => {
        codeCopyBtn.textContent = ctx.copycode.default_text;
        codeCopyBtn.classList.remove('success', 'warning');
      }, ctx.copycode.feedback_ms);
    });
  });
}

if (typeof window.codeElements !== 'undefined') {
  createCopyButtons(window.codeElements);
}
