---
title: 修复 Babel 转译将 sidebar 全局改名导致侧边栏失效 - 检查清单
date: 2026-08-16
---

# 检查清单 / 验证记录

## 验证

- [x] 主工程 `npm run g` 全量构建通过
- [x] `public/js/main.js` 含 `sidebar={leftbar:` 且无 `_sidebar`
- [x] 首页 HTML 内联 onclick 仍为 `sidebar.leftbar()` / `sidebar.rightbar()` / `sidebar.dismiss()`
- [ ] 部署后线上侧边栏按钮 / 遮罩 / TOC 正常，控制台无 `sidebar is not defined`

## 文档同步

- [x] 无：纯内部实现等价改写，不涉及行为 / 配置 / UI，无需更新 `docs/knowledge/` 与仓库 Wiki
