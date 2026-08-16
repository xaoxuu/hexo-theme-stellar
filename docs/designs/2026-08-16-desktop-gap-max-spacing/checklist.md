---
title: 桌面侧边栏与内容区上下间距恢复为 var(--gap-max) 检查清单
date: 2026-08-16
---

# 检查清单 / 验证记录

## 验证

- [x] 主题仓库 `npm run check` 通过
- [x] 主工程 `npm run g` 全量构建通过
- [x] 页面类型覆盖：首页 / 文章页 / Wiki 页（含右栏 TOC）构建生成无报错
- [x] `python3 docs/knowledge/tools/verify.py` 知识库硬事实核查通过（行号异常 0、版本不一致 0）
- [ ] 桌面视口目视检查：侧边栏/内容区上下 32px、吸顶对齐、无溢出

## 文档同步

- [x] `docs/knowledge/02-布局系统/sidebar-system.md` 已更新
- [x] `docs/knowledge/05-前端交互/client-side-overview.md` 已更新
- [x] `docs/knowledge/VERIFICATION.md` 已登记
- [x] `languages/` 无新增文案（不涉及）
