# 移除 jQuery：原生 DOM 封装替代

## 背景

主题全站每页通过 CDN 加载 jQuery 3.7（约 24KB gzip），实际仅用于少量 DOM 操作（选择、class 切换、append、事件绑定、offset 计算）。其余运行依赖均已原生实现，jQuery 是唯一遗留的通用 DOM 库。

## 方案

在 `layout/_partial/scripts/utils.ejs` 中新增原生 DOM 封装：

- `utils.qs(sel, ctx)` / `utils.qsa(sel, ctx)`：`querySelector(All)` 简写。
- `utils.dom(selector, ctx)`：数组式封装对象，提供 jQuery 常用子集（`find/append/remove/addClass/removeClass/toggleClass/attr/data/text/html/val/offset/on/click/focus/keydown/empty`），全部基于原生 API。

同时：

- 删除 `utils.jq()` 懒加载器与 `deps.jquery` 配置。
- 迁移 `main.js`（TOC 高亮/侧栏收起）、两个搜索模块、`services.ejs` 搜索初始化、`source/js/services/` 全部服务模块。
- 保留行为细节：TOC 的 `:first` 兜底与 `#undefined` 守卫、`scrollOffset = 32`；`append` HTML 字符串语义；搜索 `_searchInitialized` 标记与 MutationObserver 逻辑。

## 影响范围

- `layout/_partial/scripts/`：`utils.ejs`、`defines.ejs`、`services.ejs`
- `source/js/main.js`
- `source/js/search/`：`algolia-search.js`、`local-search.js`
- `source/js/services/`：15 个服务模块
- `_config.yml`：移除 `dependencies.jquery`

## 测试记录

- [ ] `npm run g && npx gulp minify` 全量验证通过
- [ ] 首页 / 文章页 / Wiki / 搜索 / data_services 页面预览无报错
- [ ] TOC 高亮与点击、搜索输入/回车/结果渲染、服务加载动画行为一致
- [ ] 控制台无 `$ is not defined` / `jQuery is not defined`

## 发版提示

移除 jQuery 属于行为变更：站点若通过 `inject.script` 注入依赖全局 `$` 的脚本将失效，需在 changelog 中说明。
