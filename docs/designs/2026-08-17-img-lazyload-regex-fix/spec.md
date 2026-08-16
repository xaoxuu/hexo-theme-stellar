---
title: img_lazyload 正则跨标签越界导致 bootstrap 被改写 加固方案
date: 2026-08-17
status: 已实施
---

# img_lazyload 正则越界修复 + 插件注册兜底 方案

## 1. 问题与目标

某使用站点（dusays.com）首页文章列表 3 秒后才显示、控制台 6 个报错。排查与本地复现结论：

- 站点构建依赖 `hexo-minify`（`hexo g` 时默认启用，`removeAttributeQuotes: true`），其 `after_render:html` 先执行，把 `<img src="...">` 压缩成 `<img src=...>`（无引号）。
- 主题 `scripts/filters/lib/img_lazyload.js` 也注册 `after_render:html`（在压缩之后执行），原正则 `/<img(.*?)src="(.*?)"(.*?)>/gi` 找不到图片自身带引号的 `src="`，`.*?` 便跨标签一路扫到页尾 bootstrap 内联脚本里的 `s.src = "/js/utils.js?v=..."`，把该字符串替换成「1×1 PNG 占位 + `data-src`」。
- 替换结果为 `s.src="data:image/png;base64,..." data-src="/js/utils.js?v=..."`——缺少逗号 → `SyntaxError`，整个 `window.stellar` bootstrap 未执行。
- 连锁报错：4× `ReferenceError: stellar is not defined`（swiper/scrollreveal/copycode/adaptive-text）+ `TypeError: stellar.initPlugin is not a function`（services.js）。
- ScrollReveal 从未初始化，`.slide-up` 文章卡片保持 `visibility: hidden`，只能等 3 秒 `sr-fallback` 看门狗强制显示（实测首卡约 3.1s 可见）。

该 bug 在主题仓库 HEAD（1.42.0）中同样存在，只在「HTML 压缩器先去掉属性引号」时触发，因此主题自带 demo（gulp 构建）未暴露。

成功标准：

1. 无引号 `src` 的 `<img>` 也能被正确懒加载，且任何内联脚本中的 `s.src = "..."` 不再被改写。
2. 即使 bootstrap 被第三方优化器改写/移除，页面不再产生 `stellar is not defined` 连锁报错，插件仍可注册运行。
3. 正常站点零回归；hexo-minify 与主题懒加载过滤器兼容。

## 2. 技术方案

### 2.1 根因修复：重写 `scripts/filters/lib/img_lazyload.js`

- 从「正则匹配整段 `<img ... src="..." ...>`」改为**属性感知的标签扫描**：
  - 逐字符扫描页面，只处理真实 `<img>` 标签，标签边界用「引号感知」的 `>` 判定（属性值内含 `>` 不误截断）。
  - 完整跳过 `<script>…</script>`、`<style>…</style>`、`<!-- … -->` 区域，杜绝把脚本/样式里的 `<img`、`src=` 当成图片处理。
  - 用小型属性解析器读取 `src`/`class` 等属性，兼容双引号、单引号与无引号写法（压缩器产物）。
  - 保留既有跳过规则：已有 `data-src`、`srcset`、`data:image`、`no-lazy`（含 `no-lazy=""`）不处理；空 `src`/无 `src` 原样返回。
  - 保留既有输出形态：无 `class` 时补 `class="lazy"`，有 `class` 时追加 `lazy`，`src` 替换为占位图 + `data-src`。
- 导出 `lazyProcess` 供单测；`processSite` 对外 API 不变，注册仍为 `after_render:html`。

### 2.2 防御加固

- `layout/_partial/scripts/bootstrap.ejs`：utils 补载脚本改用 `s.setAttribute('src', ...)` 赋值，避免被基于 `s.src = "<url>"` 的朴素正则（图片懒加载 / 脚本延迟优化器）再次改写。
- `layout/_plugins/index.ejs` 顶部新增兜底 shim：`window.stellar.initPlugin` 缺失时补一个等价注册点（utils 就绪时直接委托 `utils.initPlugin`，未就绪时入队，utils 加载后自动补跑），保证即使 bootstrap 失效也不产生 `stellar is not defined` 连锁报错，插件仍能注册。

### 2.3 ScrollReveal 本地化决策（本次不实施）

调研结论：`scrollreveal@4.0.9` 官方 dist 头与 package.json 均声明 **GPL-3.0**（开源/非商用），商业站点需购买商用授权；与主题的 MIT 协议冲突，**不宜内置进主题包**。本次保持 `plugins.scrollreveal.js` 的 CDN 默认（gcore.jsdelivr.net），3 秒 `sr-fallback` 看门狗保留。修复 2.1/2.2 后 scrollreveal 能正常初始化，看门狗基本不再触发；如后续要彻底去除 CDN 依赖，需自研 IntersectionObserver 入场动画（主题自有代码，MIT 兼容），另立方案。

## 3. 影响范围

- `scripts/filters/lib/img_lazyload.js`：行为修正（无引号 `src` 的图片现在也会被懒加载；不再跨标签越界）。
- `layout/_partial/scripts/bootstrap.ejs`：补载脚本赋值方式微调，行为等价。
- `layout/_plugins/index.ejs`：新增兜底 shim，正常路径为空操作。
- 无配置项、无用户可见 API 变化。
- 知识库同步：`05-前端交互/client-side-overview.md`、`07-外部集成/plugin-system.md`、`09-高级主题/performance.md`；`VERIFICATION.md` 登记。

## 4. 验证方式

- 新增 `test/img_lazyload.test.js`：带引号/无引号 `src`、跳过规则、自闭合、类名追加、脚本/样式/注释不处理、回归用例「无引号 img + 内联 `s.src="..."` 不被改写」。
- 主题 `npm run check`（lint + 单测 + 依赖声明 + 知识库硬事实核查 + 提交登记检查）。
- 主工程 xaoxuu.com `npm run g` 全量构建。
- 回归复现：在 penndu/hexo 克隆应用修复后 `hexo g`，断言产物 HTML 中 bootstrap 无 `data:image/png` 破坏；无头 Chrome 打开本地生成站点，断言 0 控制台报错、首卡可见时间显著低于 3 秒。
