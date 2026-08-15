---
title: 按需打包优化执行计划
date: 2026-08-15
---

# 执行计划

## 实施步骤

1. [x] CSS：mermaid/swiper/fancybox → `source/css/plugins/`，`_plugins/comments/*` → `source/css/comments/`；各文件头部补 `_defines` 导入；重写 `_plugins/index.styl`（移除插件/评论导入并删除 bug 条件段）。
2. [x] CSS 运行时注入：`layout/_plugins/swiper.ejs`、`mermaid.ejs`、`fancybox.ejs` 与五个评论 script partial 增加 `utils.css()` 本地样式加载。
3. [x] JS 外置：新增 `source/js/utils.js`、`theme.js`、`services.js`、`tagtree.js`；新增 `scripts/generators/stellar-icons.js`；`sidebar` 并入 `main.js`。
4. [x] 模板更新：`scripts.ejs` 重排加载顺序并门控 tagtree；`defines.ejs` 去掉图标内联、加入 `ctx.services`/`__STELLAR_I18N__`。
5. [x] 验证：主题 `npm run check`、主工程 `npm run g`、页面类型与体积前后对比（交互回归待用户 `npm run s` 验收）。
6. [x] 文档同步：`docs/knowledge/` 多篇 + `VERIFICATION.md` + 合并版；主仓库 `docs/specs/on-demand-bundling/`；`source/wiki/stellar/advanced-settings.md`。

## 风险与回退

- 风险：utils.js 加载顺序破坏解析期依赖 → 保持同步加载并在 `scripts.ejs` 置顶；CSS 按需加载造成闪烁 → 防闪烁规则留在 `main.css`；tagtree 门控误判 → 门控失败时全页面 emit（脚本本身无元素即空转）。
- 回退：改动保留在工作区，可整体还原；不自动提交。
