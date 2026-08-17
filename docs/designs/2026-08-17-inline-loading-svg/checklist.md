---
title: loading 自包含化检查清单
date: 2026-08-17
---

# 检查清单 / 验证记录

## 验证

- [x] `npm run check`：lint 通过、128 单测通过（含 icons 键完整性）、依赖声明与 AI 规范引用检查通过
- [x] 在主工程执行 `npm run g` 全量构建通过（hexo generate + gulp minify）
- [x] 产物核对：评论容器输出 `<div class="lazy-icon"></div>` 无内联背景；`<head>` 含 `--icon-loading:url("data:image/svg+xml,…")`（含 3 处 `currentColor`，无裸 `<`）；页面无 `def.loading` 与 `api.iconify.design`；`main.css` 含 `.lazy-icon` 的 `background-color:var(--theme)` + `mask-image:var(--icon-loading,…)` 回退；`js/icons/default.json` 含 `default:loading`（currentColor）
- [ ] 浏览器目验：图片/评论/最新评论/timeline/友链占位显示当前文字色三圆点，深浅色均可见，DevTools 确认无 api.iconify.design 请求（需本地 `npm run s` 目验）

## 文档同步

- [x] `docs/knowledge/04-标签插件/icon-tag.md` 已更新
- [x] `docs/knowledge/00-总览与安装配置/configuration.md` 已更新
- [x] `docs/knowledge/VERIFICATION.md` 已登记
