---
title: 图标异步加载优化 执行计划
date: 2026-08-15
---

# 执行计划

## 实施步骤

1. [x] 方案文档（`docs/designs/2026-08-15-async-icon-loading/`）
2. [x] 服务端 `icon()` 第三参 + 首屏模板 inline 标记（`scripts/events/lib/utils.js`、`scripts/helpers/icon.js`、`layout/_partial/sidebar/search.ejs`、`layout/_partial/sidebar/menu.ejs`、`layout/_partial/sidebar/logo.ejs`、`layout/_partial/menubtn.ejs`、`layout/_partial/widgets/toc.ejs`）
3. [x] 生成器扩展（`scripts/generators/stellar-icons.js` 输出 `js/icons/{ns}.json`）
4. [x] 客户端加载器 `source/js/icons.js` + `layout/_partial/scripts.ejs` 引用
5. [x] 单测与主题文档同步（`test/icons.test.js`、`_data/icons.yml` 注释、`docs/knowledge/`、`VERIFICATION.md`）
6. [x] 主题 `npm run check` 验证
7. [x] 主工程 `npm run g` + 体积对比 + 页面抽查
8. [x] 主仓库 wiki 文档同步（`source/wiki/stellar/tag-plugins/express.md`）

## 风险与回退

- 风险：异步图标替换延迟造成短暂空白；占位符元素与 CSS 选择器不匹配的瞬时布局变化。
- 回退：占位符沿用 `<svg class="icon">` 元素保证尺寸样式即时生效；若个别场景出现回归，将该调用点改回 `inline=true` 即可单点恢复。
