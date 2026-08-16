---
title: 右边栏加宽 32px 检查清单
date: 2026-08-16
---

# 检查清单 / 验证记录

## 验证

- [x] 主题仓库 `npm run check` 通过
- [x] 主工程 `npm run g` 全量构建通过
- [x] 页面类型覆盖：首页 / 文章页 / Wiki 页
- [x] CDP 布局实测：桌面右栏 320px、左栏 288px，内容列 1280≈544、1440≈704、1536+ 720，无横向溢出
- [x] 右栏 `.l_right .widgets` padding：桌面端 0，折叠抽屉 `var(--gap-base) 0`（16px 0）
- [x] 折叠位移改为 `calc(100% + var(--inset) * 2)`，收拢后完全隐藏（平板/移动抽屉无露边）
- [ ] 桌面视口目视检查（用户 `npm run s` 验收）

## 文档同步

- [x] `docs/knowledge/02-布局系统/sidebar-system.md` 已更新
- [x] `docs/knowledge/01-样式系统/responsive-design.md`、`design-tokens.md` 已更新
- [x] `docs/knowledge/VERIFICATION.md` 已登记
- [x] `languages/` 无新增文案（不涉及）
