---
title: 发版版本同步门禁修复检查清单
date: 2026-08-20
---

# 检查清单 / 验证记录

## 验证

- [x] `node --test test/release.test.js` 通过（6/6）
- [x] `npm run check` 通过（lint、137/137 测试、规范引用、提交登记）
- [x] `python3 docs/knowledge/tools/verify.py` 通过，版本不一致为 0
- [x] 主题主分支新 CI 全部通过（[run 32333812519](https://github.com/xaoxuu/hexo-theme-stellar/actions/runs/32333812519)）
- [x] npm latest、1.43.0 tag 与 GitHub Release 保持不变

## 文档与交付

- [x] 安装知识库版本同步为 1.43.0
- [x] `docs/guides/release-process.md` 已同步最终态检查与恢复规则
- [x] 主题修复仅推送 `main`，`npm` 分支仍停在 `a558ac7`
- [ ] 主仓库子模块指针已本地提交且未推送
