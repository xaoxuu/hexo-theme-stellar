---
title: 按需打包优化（HTML/CSS/JS 体积优化）
date: 2026-08-15
status: 已通过
---

# 按需打包优化 方案

## 1. 问题与目标

- 当前每页固定加载 `main.css`（约 258KB），其中包含 swiper、fancybox、artalk 评论及 twikoo/utterances/waline/beaudar 等仅少数页面使用、甚至站点未启用的样式；`_plugins/index.styl` 中 `index(comments.custom_css, 'xxx') >= 0` 在 Stylus 下恒为真，导致五种评论系统的样式全部编入 `main.css`。
- 每页内联脚本约 31~34KB（defines 配置、utils 工具代码、services 运行时、sidebar/tagtree/theme/lazyload），182 个页面重复携带，浏览器无法缓存。
- 成功标准：插件/评论 CSS 按运行时 DOM 检测按需加载；重复脚本外置可缓存；每页内联 HTML 显著下降；各页面类型功能不回归。

## 2. 技术方案

策略：运行时 DOM 检测（与现有 swiper/fancybox 一致），外部 JS 多文件 + 缓存，不引入新构建系统，保持 Hexo + Gulp 管线。

### CSS 按需拆分

- 将 `source/css/_plugins/` 下 mermaid、swiper、fancybox 移入 `source/css/plugins/`（非下划线开头，Hexo 独立编译为 `css/plugins/*.css`），`_plugins/comments/` 五个评论样式移入 `source/css/comments/`（编译为 `css/comments/*.css`）。
- 独立文件按需导入 `_defines/const`、`_custom`、`_defines/func`（仅变量与 mixin，无额外输出；`_custom` 自带约 1.5KB `:root` 变量块，随文件按需加载，可接受）。
- `_plugins/index.styl` 移除上述导入，保留 lazyload、scrollreveal（防闪烁规则必须常驻核心）、aplayer、copycode 等极小样式，并删除存在 bug 的评论样式条件段。
- 运行时注入：swiper/mermaid/fancybox 插件 partial 在已有 DOM 检测处调用 `utils.css()` 加载本地 CSS（URL 带 `?v=<版本>`）；各评论 script partial 在与评论库相同的加载函数内追加本地评论 CSS。

### JS 外置 + 按页裁剪

- `layout/_partial/scripts/utils.ejs` 原样抽为 `source/js/utils.js`，在 `scripts.ejs` 中同步 `<script src>` 加载（解析期依赖，页尾内联插件片段在解析时即调用 `utils.initPlugin`，不能 defer）。
- 新增构建期生成的 `/js/stellar-icons.js`（`scripts/generators/stellar-icons.js`，defer），`defines.ejs` 不再内联 5 个图标 SVG（约 6KB/页）。
- `theme.ejs` → `source/js/theme.js`、`services.ejs` → `source/js/services.js`、`tagtree.ejs` → `source/js/tagtree.js`（defer）；主题切换 i18n 文案并入 defines 的 `window.__STELLAR_I18N__`；tagtree 配置经 `window.__STELLAR_TAGTREE__` 传入，脚本仅在与 tagtree 小部件渲染相同的条件（`page.leftbar` 含 tagtree）下 emit。
- `sidebar`（纯 JS）并入 `main.js`；`lazyload.ejs` 配置保持内联（必须先于 async 的 vanilla-lazyload 库执行）。
- `services.js` 全页面 emit，`ctx.services` 配置改由 `defines.ejs` 内联。

## 3. 影响范围

- 对外行为：插件/评论 CSS 由「首屏全量」改为「按需注入」，页面首次出现对应元素时可能晚几十毫秒加载样式；已保留防闪烁关键规则，不引入明显 FOUC。
- 配置项：无新增/删除；`custom_css` 语义不变（评论 CSS 统一改由对应评论服务按需加载）。
- 兼容性：JS 保持 ES2015+ 经 Babel/Terser 输出；CSS 保持兼容 IE8 的压缩输出。
- 需要同步的知识库：`docs/knowledge/05-前端交互/client-side-overview.md`、`docs/knowledge/09-高级主题/performance.md`、`docs/knowledge/07-外部集成/plugin-system.md`，并登记 `VERIFICATION.md`。

## 4. 验证方式

- 主题 `npm run check`（lint + 单测 + 依赖声明 + 知识库核查）。
- 主工程 `npm run g` 全量构建。
- 页面类型覆盖：首页、文章页（artalk 评论）、Wiki 页（tagtree + mermaid）、友链页（数据服务）、笔记页；交互回归 swiper/fancybox/mermaid/scrollreveal/搜索/主题切换/tagtree/懒加载。
- 体积对比：首页/文章/Wiki 页改造前后 HTML/CSS/JS raw 与 gzip，记录于 checklist.md。
