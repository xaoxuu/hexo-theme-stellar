---
title: 头像彩虹光环 CSS 渐变执行计划
date: 2026-08-12
---

# 执行计划

## 实施步骤

1. [x] 修改主题默认配置：删除 `style.animated_avatar.background`，新增 `style.gradient.avatar`（`_config.yml`）
2. [x] 修改样式：`div.bg` 背景改为 `convert(hexo-config('style.gradient.avatar'))`（`logo.styl`）
3. [x] 修改模板：移除 `div.bg` 内联背景样式（`logo.ejs`）
4. [ ] 更新知识库：`logo-navigation-headers.md`、`sidebar-system.md`、`知识库全量.md`、`VERIFICATION.md`
5. [ ] 验证：`npm run check`、主工程 `npm run g`、本地预览
6. [ ] 提交：主题仓库 `feat(avatar)` + `docs(knowledge)` 分开提交；主仓库更新子模块指针并同步 wiki

## 风险与回退

- 风险：`convert()` 对 conic-gradient 的解析与 `searchbar` 一致，兼容性风险低；若个别浏览器不支持 conic-gradient，光环退化为无背景（头像主体不受影响）。
- 回退：恢复 `div.bg` 的 `background-image` 内联样式与 `style.animated_avatar.background` 配置即可回退到图片方案。
