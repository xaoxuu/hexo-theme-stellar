const codeElementArr = document.querySelectorAll('.code')
codeElementArr.forEach(code => {
  // copy btn 
  const codeCopyBtn = document.createElement('div')
  codeCopyBtn.classList.add('copy-btn')
  codeCopyBtn.innerText = stellar.plugins.copycode.default_text

  code.appendChild(codeCopyBtn)

  codeCopyBtn.addEventListener('click', async () => {
    const currentCodeElement = code.children[0]?.innerText
    await copyCode(currentCodeElement)

    codeCopyBtn.innerText = stellar.plugins.copycode.success_text
    codeCopyBtn.classList.add('success')

    setTimeout(() => {
      codeCopyBtn.innerText = stellar.plugins.copycode.default_text
      codeCopyBtn.classList.remove('success')
    },3000)
  })
})

async function copyCode(currentCode) {
  if (navigator.clipboard) {
    try {
      await navigator.clipboard.writeText(currentCode)
    } catch (error) {
      // 未获得用户许可
      codeCopyBtn.innerText = '未获得用户许可'
      codeCopyBtn.classList.add('warning')
      setTimeout(() => {
        codeCopyBtn.innerText = stellar.plugins.copycode.default_text
        codeCopyBtn.classList.remove('warning')
      },3000)
    }
  } else {
    codeCopyBtn.innerText = '当前浏览器不支持此api'
    codeCopyBtn.classList.add('warning')
    setTimeout(() => {
      codeCopyBtn.innerText = stellar.plugins.copycode.default_text
      codeCopyBtn.classList.remove('warning')
    },3000)
  }
}