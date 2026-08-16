---
title: utils.js 被「脚本延迟加载」优化器改写导致页面空白 加固方案
date: 2026-08-16
status: 已实施
---

# utils.js 延迟加载加固 方案

## 1. 问题与目标

某使用站点首页（以及关于/友链等页面）文章列表空白、控制台大量报错。排查与无头 Chrome 复现结论：

- 服务端渲染正常，首页 HTML 中 10 张 `.post-card` 均在；但 `.slide-up` 默认 `visibility: hidden`，需由 scrollreveal 或 `sr-fallback` 兜底置为可见。
- 站点构建/部署环节把 `<script src="/js/utils.js?v=...">` 改写为「1×1 PNG 占位 `src` + `data-src`」，且页面无任何 loader 读取该 `data-src`；文章页不受影响。
- 结果 `utils` 从未定义：页尾所有 `utils.initPlugin(...)` 插件片段、`main.js` / `theme.js` / `services.js` 全部抛 `utils is not defined`；scrollreveal 的 `sr-fallback` 兜底注册在 `utils.initPlugin` 内，根本没机会执行，列表永久空白。
- 控制台另见 `SyntaxError: Invalid or unexpected token`，实测来自被改写的占位脚本（浏览器把 PNG 字节当 JS 解析），属同一根因。

成功标准：第三方优化器把 `utils.js` 延迟/改写/移除时，主题不报 `utils is not defined`，文章列表与各插件功能恢复；正常站点零回归。

## 2. 技术方案

- 新增 `layout/_partial/scripts/bootstrap.ejs`（在 utils.js 之前输出）：`window.stellar.initPlugin(fn, name, options)` 在 utils 就绪时直接委托 `utils.initPlugin`，未就绪时入队 `window.stellar._pluginQueue`；DOMContentLoaded 时若 utils 仍缺失，动态补载 `/js/utils.js`，失败则加 `sr-fallback` 并输出可读错误。
- `layout/_partial/scripts.ejs`：在 utils.js 标签后紧跟解析期看门狗——`typeof utils === 'undefined'` 时用 `document.write` 同步补载 utils.js，恢复「utils 先于页尾插件片段定义」的不变量（`</script>` 写成 `<\/script>`）。
- `source/js/utils.js`：整体包 IIFE，`window.__stellarUtilsLoaded` 防重复执行；末尾 `window.utils = utils` 并调用 `window.stellar._flushPlugins()`（谁加载都自动补跑队列）。
- `layout/_plugins/scrollreveal.ejs`：3 秒 `sr-fallback` 看门狗移到 `utils.initPlugin` 之外、解析期即注册，成功后清除；插件注册改用 `stellar.initPlugin`。
- 其余 `utils.initPlugin` 调用点（swiper、adaptive_text、mermaid、copycode、pin_slider、services.js）统一改为 `stellar.initPlugin`。

## 3. 影响范围

- 无配置项、无用户可见 API/行为变化；`window.stellar` 原有命名空间（main.js / color.js）合并兼容。
- 正常页面：bootstrap 与看门狗均为空操作，零回归。
- 优化器场景：解析期同步补载 utils.js，队列补跑插件；极端失败时 `sr-fallback` 保证内容可见。
- 知识库：`05-前端交互/client-side-overview.md`、`07-外部集成/plugin-system.md` 补充说明；`VERIFICATION.md` 登记。

## 4. 验证方式

- 主题 `npm run check`（lint + 单测 + 依赖声明 + 知识库硬事实核查）。
- 主工程 `npm run g` 全量构建。
- 无头 Chrome 三种模拟场景：占位改写 / 加 defer / 删除 utils.js 标签，断言无 `utils is not defined`、无重复声明、卡片可见、插件初始化正常。
- 兜底验证：拦截 utils.js 与 scrollreveal CDN 时 3 秒后 `sr-fallback` 生效，内容可见。
