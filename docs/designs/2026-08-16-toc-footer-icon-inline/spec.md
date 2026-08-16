---
title: TOC 底部按钮图标内联修复（回到顶部 / 参与讨论）
date: 2026-08-16
status: 已实施
---

# TOC 底部按钮图标内联修复 方案

## 1. 问题与目标

- 2026-08-15 的图标异步加载（`docs/designs/2026-08-15-async-icon-loading/`）把 TOC 底部「回到顶部 / 参与讨论」图标从服务端内联改为 `<svg data-icon>` 占位符，依赖 `/js/icons.js` 拉取 `js/icons/{ns}.json` 后原位替换。
- 线上（GitHub Pages + OpenResty）该 fetch 偶发失败时占位符不被替换：空 `<svg>` 在 `.widget-footer a svg { width:auto }` 下撑满按钮行宽（无头 Chrome 实测 183~202px），文字被挤到约 2 字宽导致换行；本地 localhost 拉取稳定，未复现。
- 成功标准：两个按钮图标由服务端内联输出，不依赖异步加载；任何占位符/加载失败状态都不再挤压文字导致换行。

## 2. 技术方案

- `layout/_partial/widgets/toc.ejs`：`icon('default:upup')` / `icon('default:tocomment')` 传第三参 `inline=true`，与已内联的 `default:rightbar` 一致。
- `source/css/_components/widgets/toc.styl`：`.widget-footer a` 下 `svg,img` 拆分为独立规则——`svg` 固定 16×16 且 `flex-shrink:0`，`img` 保持 `height:16px; width:auto` 并加 `flex-shrink:0`，占位符即使未替换也不再撑宽。
- 不动 `scripts/`、`source/js/`、生成器与 `js/icons/{ns}.json`。

## 3. 影响范围

- 对外行为：每页含 TOC footer 时 HTML 增加约 4KB 内联 SVG；这两个按钮不再依赖异步图标加载，加载失败时也保持布局稳定。
- 配置项：无。
- 需要同步的知识库：`docs/knowledge/09-高级主题/performance.md`、`docs/knowledge/04-标签插件/icon-tag.md`、`VERIFICATION.md`；主仓库 `source/wiki/stellar/tag-plugins/express.md`。

## 4. 验证方式

- 主题 `npm run check`（lint + 单测 + 依赖声明 + 知识库硬事实核查）。
- 主工程 `npm run g` 全量构建；断言 `public/wiki/stellar/examples/index.html` 中 `.widget-footer` 的两个图标为完整内联 `<svg>`（无 `data-icon` 占位符）。
- 页面抽查：首页 / 文章页 / Wiki 页 / 窄屏断点。
- 无头 Chrome 对照验证：占位符 + 守卫 CSS 下文字单行（见 checklist.md）。
