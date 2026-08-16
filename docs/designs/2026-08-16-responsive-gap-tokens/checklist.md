---
title: 间距令牌简化为 --gap-base + --gap-page 检查清单
date: 2026-08-16
---

# 检查清单 / 验证记录

## 验证

- [x] 主题仓库 `npm run check` 通过
- [x] 主工程 `npm run g` 全量构建通过
- [x] 页面类型覆盖：首页 / 文章页 / Wiki 页
- [x] `rg -- '--gap-(margin|padding|max)'` 源码无残留（仅历史文档）
- [x] CDP 布局实测：1000–2048px 无横向溢出，内容列 1280≈512、1440≈672、1536+ 恢复 720，侧边栏四周间距一致（32px/16px）、内部间距固定 16px、吸顶 top 对齐
- [ ] 桌面视口目视检查（用户 `npm run s` 验收）

## 文档同步

- [x] `docs/knowledge/01-样式系统/*` 已更新
- [x] `docs/knowledge/02-布局系统/sidebar-system.md` 已更新
- [x] `docs/knowledge/09-高级主题/custom-styling-overrides.md` 已更新
- [x] `docs/knowledge/VERIFICATION.md` 已登记
- [x] `languages/` 无新增文案（不涉及）
