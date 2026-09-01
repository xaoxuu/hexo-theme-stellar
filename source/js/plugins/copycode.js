function createCopyButtons(codeElements) {
  codeElements.forEach((codeElement) => {
    if (codeElement.querySelector('.copy-btn')) return;
    // 创建复制按钮
    const codeCopyBtn = document.createElement('button');
    const copyIcon = ctx.icons['copy:copy'] || '';
    codeCopyBtn.className = 'copy-btn';
    codeCopyBtn.type = 'button';
    codeCopyBtn.innerHTML = copyIcon;
    codeCopyBtn.setAttribute('aria-label', ctx.copycode.label);
    codeCopyBtn.setAttribute('title', ctx.copycode.label);
    codeElement.appendChild(codeCopyBtn);

    // 添加点击事件监听
    codeCopyBtn.addEventListener('click', async () => {
      const codeToCopy = codeElement.querySelector('pre')?.innerText || '';
      if (navigator.clipboard) {
        try {
          await navigator.clipboard.writeText(codeToCopy);
          hud.toast(ctx.copycode.copied, ctx.copycode.toast_ms);
        } catch (error) {
          hud.toast(ctx.copycode.denied, ctx.copycode.toast_ms);
        }
      } else {
        hud.toast(ctx.copycode.unsupported, ctx.copycode.toast_ms);
      }
    });
  });
}

if (typeof window.codeElements !== 'undefined') {
  createCopyButtons(window.codeElements);
}
