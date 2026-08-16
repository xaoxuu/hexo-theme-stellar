---
title: 统一背景图观感检查清单
date: 2026-08-16
---

# 检查清单 / 验证记录

## 验证

- [x] `npm run check` 通过（lint + 91 单测 + 知识库硬事实核查，行号异常 0 / 版本不一致 0）
- [x] 在主工程执行 `npm run g` 全量构建通过（`scripts/tags/lib/banner.js` 有改动，必做）
- [x] 产物结构核验：post 轮播与 banner 标签带 `--pin-cover-url`/`--bg-url` 内联变量与蒙版元素；`pin-slide-mask` 已移除；`cover-overlay` 相关 CSS 规则（`--cover-zoom`、`.banner-mask-top`、`.article.banner:hover .bg`、wiki/单侧 blur 层）均编译进 `main.css`
- [ ] 浏览器视觉检查待用户 `npm run s` 预览验收：首页（post 轮播 + poster 封面 top/bottom）/ wiki 列表页（wiki 轮播）/ 带 banner 文章页与归档页 / 含 `{% banner %}` 页面；核对静止态蒙版与模糊层常驻、hover 放大 + 变暗、明暗主题、移动端圆角归零

## 文档同步

- [x] `docs/knowledge/03-内容系统/post-lists-cards.md` 已更新（通用 mixin 说明）
- [x] `docs/knowledge/03-内容系统/content-overview.md` 已更新（顶部横幅覆盖层常驻 + hover）
- [x] `docs/knowledge/04-标签插件/link-grid-banner-tags.md` 已更新（banner 标签 `--bg-url`/蒙版/覆盖层）
- [x] `docs/knowledge/05-前端交互/client-side-overview.md` 已更新（轮播覆盖层统一）
- [x] `docs/knowledge/知识库全量.md` 已同步
- [x] `docs/knowledge/VERIFICATION.md` 已登记
- [x] 主仓库 `source/wiki/stellar/`（advanced-settings / tag-plugins/container / pages）已同步并刷新 `updated`
