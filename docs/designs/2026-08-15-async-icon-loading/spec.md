---
title: 图标异步加载优化（按命名空间异步加载 + 首屏关键图标内联）
date: 2026-08-15
status: 已通过
---

# 图标异步加载优化 方案

## 1. 问题与目标

- 当前 `hexo.utils.icon()` 在构建期把 `_data/icons.yml`（含站点 `source/_data/icons.yml` 覆盖）中的 SVG 原样内联进 HTML：全站 182 个页面共内联约 3.02MB SVG（占 HTML 总量 29.5%），首页约 47KB；同一批首屏/侧栏图标随每个页面重复传输，浏览器无法缓存。
- 成功标准：除首屏关键图标（搜索、菜单、leftbar/rightbar、goback）外，其余图标改为异步加载；页面 HTML 内联 SVG 显著下降；异步图标最终以与现状一致的内联 SVG 形态注入，现有 CSS 钩子（搜索三态、菜单渐变、leftbar 动画、chat 着色）零改动可用。

## 2. 技术方案

策略：服务端占位符 + 构建期生成按命名空间拆分的图标 JSON + 客户端 defer 加载原位替换；不引入新构建系统，保持 Hexo + Gulp 管线。

### 服务端 icon()

- `scripts/events/lib/utils.js` 的 `hexo.utils.icon(key, args, inline)` 扩展第三参：
  - URL 值（`/`、`http(s)://`）仍输出 `<img ${args} src=...>`（保持内联，极小）。
  - SVG 值：`inline === true` 时原样输出（现状行为）；否则输出占位符 `<svg class="icon" data-icon="key" aria-hidden="true"></svg>`。
  - 缺失键仍返回 key 原文（现状行为）。
- 首屏模板显式内联（`inline=true`）：`layout/_partial/sidebar/search.ejs`（`default:search`）、`layout/_partial/sidebar/menu.ejs`（菜单任意键，含站点 `solar:*`）、`layout/_partial/menubtn.ejs`（leftbar/rightbar）、`layout/_partial/sidebar/logo.ejs`（goback）。其余调用点（widgets、标签插件、翻页、评论）默认异步。
- 理由：菜单渐变 `> svg [fill="currentColor"]`、搜索三态 `path[p-id="1562"]`、leftbar `path#sep` 动画都依赖内联 DOM 结构，保留内联可避免 CSS 重构；异步图标最终仍以内联 SVG 形态注入，chat 等所有 `>path` 着色规则不受影响。

### 构建期生成器

- `scripts/generators/stellar-icons.js` 保留现有 `/js/stellar-icons.js`（`ctx.icons` 客户端白名单，供 weibo/timeline/loading 动态渲染，行为不变）。
- 新增按命名空间生成 `js/icons/{ns}.json`：遍历合并后的 `theme.config.icons`（主题 `_data/icons.yml` + 站点 `source/_data/icons.yml` 覆盖），仅收集 `<svg` 开头的字符串值，去除 SVG 注释后 `JSON.stringify`；URL 值跳过。

### 客户端加载器

- 新增 `source/js/icons.js`（defer），在 `layout/_partial/scripts.ejs` 中引用，位置在 `stellar-icons.js` 之后；script 标签带 `data-version="<%- stellar_info('version') %>"` 供缓存版本化。
- 收集 `svg.icon[data-icon]` 占位符按命名空间分组；对每个命名空间 `fetch(ctx.root + 'js/icons/' + ns + '.json?v=' + version)`；成功后用 `node.outerHTML = svg` 原位替换；请求失败或键缺失仅 `console.warn`，不影响页面。
- `_data/icons.yml` 头部注释更新机制说明。

## 3. 影响范围

- 对外行为：非首屏图标由「服务端内联」改为「JS 异步注入」，页面解析后片刻才出现；无 JS 时这些图标不显示（主题本身强依赖 JS），首屏关键图标不受影响。
- 配置项：无新增/删除，站点无需改配置。
- 兼容性：浏览器 JS 保持 ES2015+（Gulp Babel/Terser 输出）；最终 DOM 与现状一致，CSS 无需改动。
- 需要同步的知识库：`docs/knowledge/09-高级主题/performance.md`、`docs/knowledge/04-标签插件/icon-tag.md`，并登记 `docs/knowledge/VERIFICATION.md`；主仓库 `source/wiki/stellar/tag-plugins/express.md` 补充说明。

## 4. 验证方式

- 主题 `npm run check`（lint + 单测 + 依赖声明 + 知识库核查）；`test/icons.test.js` 补 `icon()` 占位符/inline/URL 行为与生成器测试，并修正键完整性扫描正则以匹配新调用签名。
- 主工程 `npm run g` 全量构建（涉及 `scripts/` 必做）。
- 页面类型覆盖：首页、文章页、Wiki 页、标签/分类页、关于页；交互回归：搜索三态、菜单 hover/active 渐变、移动端 leftbar/rightbar 动画、标签插件（quot/vote/rating/icon/copy）、评论 loading、weibo/timeline（`ctx.icons` 白名单）。
- 体积对比：构建前后 `public/` 总内联 SVG 字节数与首页内联 SVG 字节数，记录于 checklist.md。
