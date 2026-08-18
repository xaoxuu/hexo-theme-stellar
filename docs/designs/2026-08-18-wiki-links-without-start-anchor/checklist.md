---
title: Wiki 首页链接移除 start 锚点检查清单
date: 2026-08-18
---

# 检查清单 / 验证记录

## 验证

- [x] Wiki 首页条目直接使用 `pretty_url(p.path)`，不再附加 `#start`。
- [x] 非首页条目链接逻辑未变。
- [x] Wiki Hero 的“文档”按钮仍保留 `#start` 页内定位。
- [x] 无 hash 初始打开 Wiki Hero 时保持页面顶部。
- [x] 显式 `#start` 初始打开仍定位正文。
- [x] 主工程 `npm run g` 通过。

## 文档同步

- [x] `docs/knowledge/02-布局系统/sidebar-system.md`、`05-前端交互/toc-system.md` 和 `core-js-init.md` 已更新。
- [x] `docs/knowledge/VERIFICATION.md` 已登记。
- [x] 主工程 `source/wiki/stellar/sidebar.md` 已更新。
