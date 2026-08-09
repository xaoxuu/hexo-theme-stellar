# Mermaid v11 升级（修复 mermaid.run() 不渲染）

日期：2026-08-09

关联 issue：[#682 Mermaid 不渲染](https://github.com/xaoxuu/hexo-theme-stellar/issues/682)

## 问题

commit a55fd95（#645 pjax 动态组件重构）将 `layout/_plugins/mermaid.ejs` 的初始化方式改为：

```js
mermaid.initialize(mermaid_config);
mermaid.run();
```

`mermaid.run()` 是 mermaid v10 引入的 API，而 `_config.yml` 中默认 CDN 仍为 mermaid v9：

```yaml
js: https://gcore.jsdelivr.net/npm/mermaid@v9/dist/mermaid.min.js
```

v9 的 dist 包中没有 `run` 导出，页面会报 `mermaid.run is not a function`，导致所有 mermaid 图表不渲染。

## 变更

- `_config.yml`：`plugins.mermaid.js` 默认 CDN 从 `mermaid@v9` 升级到 `mermaid@11`，同步更新注释中的 unpkg 示例。
- 无需改动 `mermaid.ejs`：`initialize({ startOnLoad: false }) + run()` 与 v10/v11 完全兼容。

## 影响范围

- 使用主题默认 mermaid CDN 的所有站点（含 xaoxuu.com 的 wiki 图表页）。
- 未在站点配置中覆盖 `plugins.mermaid.js` 的站点，升级主题后自动获得 v11。

## 验证记录

- [x] `npm run g`（hexo generate + gulp minify）构建通过
- [x] 生成页面中 mermaid 脚本指向 v11
- [x] 浏览器实测 wiki 图表页正常渲染 SVG（用户本地验证通过）
