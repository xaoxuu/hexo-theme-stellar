# Stellar 主题及 xaoxuu.com 项目全面分析报告

> 审计日期：2026-08-08 | 版本：hexo-theme-stellar v1.33.1 | Hexo 7.0.0

## 一、项目概览

| 维度 | 详情 |
|------|------|
| **站点** | `xaoxuu.com` 个人博客，Hexo 7.0.0 |
| **主题** | `hexo-theme-stellar` v1.33.1（Git 子模块） |
| **部署** | GitHub Actions → gh-pages + Vercel 边缘 |
| **模板引擎** | EJS + Stylus |
| **内容规模** | ~100 篇文章（2013-2026），wiki 文档、笔记系统 |
| **语言** | zh-CN / en / zh-TW 多语言 |

---

## 二、高优先级问题清单（按紧急程度排序）

### P0 - 阻塞性/安全性问题

#### 问题 1：缺少安全响应头（CSP / X-Frame-Options / X-Content-Type-Options）

**场景**：当前 HTML 响应头中未设置任何安全策略头，站点对所有浏览器默认攻击面完全暴露。

**影响范围**：全局，所有页面。

**根因**：`layout/_partial/head.ejs` 模板中没有添加安全头部，`vercel.json` 也仅配置了缓存策略。

**修复方向**：
1. 在 `layout/_partial/head.ejs` 中添加 `<meta http-equiv>` 级别的基础安全策略（作为最低保障）
2. 在 `vercel.json` 中添加 `Content-Security-Policy`、`X-Frame-Options: DENY`、`X-Content-Type-Options: nosniff` 响应头

**复杂度**：低 | **建议时间**：1 周内

---

#### 问题 2：Tag 插件存在 XSS 注入风险

**场景**：多个 tag 插件在渲染用户可控内容（`alt`、`title`、`url` 参数）时直接拼接到 HTML 属性中，未做转义处理。

**影响范围**：所有使用 tag 插件的页面。若结合友链等用户贡献内容存在被注入风险。

**具体位置**：

| 文件 | 行号 | 风险参数 |
|------|------|----------|
| `scripts/tags/lib/image.js` | L45 | `alt` 直接拼接 |
| `scripts/tags/lib/frame.js` | L61 | `alt` 直接拼接 |
| `scripts/tags/lib/folding.js` | L23 | `title` 通过 markdown 渲染但未过滤 HTML 标签 |
| `scripts/tags/lib/link.js` | L52 | `title` 直接拼接 |

**修复方向**：对所有用户可控的输出进行 `escape_html` 或等效转义处理后再嵌入 HTML。

**复杂度**：中 | **建议时间**：2 周内

---

#### 问题 3：`glob` 依赖未声明导致构建可能失败

**场景**：`scripts/events/lib/get_image_ratios.js` L3 中 `require('glob')` 引入了 `glob` 包，但该包未在主题 `package.json` 或站点 `package.json` 中声明为依赖。当前能运行是因为 `gulp` 的传递依赖中存在 glob，但这是一个脆弱的巧合。

**影响范围**：启用 `lazyload.fix_ratio` 功能的 `hexo server` 模式。在全新 `npm install --production` 环境下必然失败。

**修复方向**：在 `themes/stellar/package.json` 的 `dependencies` 中添加 `"glob": "^10.x"`。

**复杂度**：低 | **建议时间**：1 周内

---

### P1 - 严重影响可用性

#### 问题 4：GitHub Actions 使用已弃用的 Node 16 actions

**场景**：`.github/workflows/auto-deploy.yml` 中 `actions/checkout@v3` (L15) 和 `peaceiris/actions-gh-pages@v3` (L29) 均依赖 Node.js 16，GitHub 已宣布逐步弃用。

**影响范围**：CI 自动部署流程将中断。

**修复方向**：升级 `actions/checkout@v4` 和 `peaceiris/actions-gh-pages@v4`。

**复杂度**：低 | **建议时间**：1 周内

---

#### 问题 5：`document.execCommand("Copy")` 已弃用

**场景**：`source/js/main.js` L40 中使用 `document.execCommand("Copy")` 实现复制功能，该 API 已被 W3C 标记为废弃，主流浏览器未来版本将移除。

**影响范围**：所有页面的「复制代码」功能。

**修复方向**：迁移到 `navigator.clipboard.writeText()` API。

**复杂度**：低 | **建议时间**：2 周内

---

#### 问题 6：构建后缺少 JS/CSS 压缩步骤

**场景**：CI 流水线（`.github/workflows/auto-deploy.yml`）仅执行 `hexo generate`，未运行 gulpfile 中的 JS/CSS/HTML 压缩任务。而 `gulpfile.js` 配置了完整的压缩流程（babel + terser + cleanCSS + htmlmin）。

**影响范围**：生产环境部署的静态资源未经压缩，JS 文件体积较大，直接影响首屏加载速度。

**修复方向**：在 CI 的 "Generate Public Files" 步骤后、部署前添加 `npx gulp minify`。

**复杂度**：低 | **建议时间**：1 周内

---

#### 问题 7：首屏加载阻塞 — jQuery 和 Marked 同步加载

**场景**：CSS 采用同步 `<link>` 加载（`layout/_partial/head.ejs` L190），jQuery（3.7）和 Marked（13.0）虽然以 `defer` 方式加载（`layout/_partial/scripts.ejs` L25），但 CSS 阻塞渲染的问题仍然存在，且大量 CDN 依赖增加了网络往返次数。

**影响范围**：首屏加载时间可能超过 3 秒（尤其在 CDN 网络抖动时）。

**修复方向**：
1. 将非首屏必需的 CSS 延迟加载
2. 考虑将核心 CSS 内联到 `<head>` 中
3. 为 CDN 资源添加 `dns-prefetch`（已部分实现 preconnect）

**复杂度**：中 | **建议时间**：1 个月内

---

### P2 - 阻碍主题迭代

#### 问题 8：无测试覆盖

**场景**：主题 `package.json` 中 `"test": "echo test"`，零测试覆盖。tag 插件多达 40+ 个，任何修改都可能引入回归。

**影响范围**：主题维护效率低，发布后经常出现回归问题。

**修复方向**：至少为核心 tag 插件、配置合并逻辑、URL 生成逻辑添加单元测试。推荐使用 mocha + chai。

**复杂度**：高 | **建议时间**：3 个月内逐步覆盖

---

#### 问题 9：大型内联 SVG 造成代码膨胀

**场景**：`scripts/tags/lib/chat.js` 文件 ~517 行中包含大量内联 SVG 数据（浏览器图标 ~10 个、文件类型图标 ~15 个），使得 tag 插件脚本体积显著增大。

**影响范围**：每次 hexo generate 时都会加载这些数据到内存，构建性能受影响。

**修复方向**：将 SVG 数据外置到独立 JSON/YAML 文件，通过 `require` 引用。

**复杂度**：低 | **建议时间**：1 个月内

---

#### 问题 10：主题内 `hexo-fs` 依赖未声明且未使用

**场景**：`scripts/filters/lib/img_onerror.js` L8 中 `const fs = require('hexo-fs')` 声明了变量但未实际使用（该函数只用到 `this.theme.config.default.image`）。

**影响范围**：轻微性能影响，且若 `hexo-fs` 在未来版本中行为变化可能引入问题。

**修复方向**：移除未使用的 `require('hexo-fs')`。

**复杂度**：低 | **建议时间**：1 周内

---

### P3 - 生产环境潜在风险

#### 问题 11：无站点监控/告警机制

**场景**：当前仅靠 GitHub Actions 构建成功后 curl 触发服务器更新。无任何可用性监控、无错误追踪、无流量异常告警。

**影响范围**：站点故障时依赖用户反馈，恢复时间不可控。

**修复方向**：接入 UptimeRobot 或类似免费监控服务，配置宕机告警。

**复杂度**：低 | **建议时间**：2 周内

---

#### 问题 12：`hexo-all-minifier` 安装但未启用

**场景**：站点 `package.json` 中安装了 `hexo-all-minifier`，但 `_config.yml` 中 `all_minifier: false`。如果意外启用，可能和 gulp 压缩产生冲突。

**修复方向**：若已使用 gulp 替代，应移除该依赖。

**复杂度**：低 | **建议时间**：按需

---

## 三、快速修复建议（按工作量排序）

| # | 问题 | 工作量 |
|---|------|--------|
| 1 | 移除 `img_onerror.js` 中未使用的 `hexo-fs` require | 5 min ~~已修复~~ |
| 2 | 添加 `glob` 到 theme package.json dependencies | 5 min ~~已修复~~ |
| 3 | 添加安全响应头 (vercel.json) | 15 min ~~已修复~~ |
| 4 | 升级 GitHub Actions (`checkout@v4`, `gh-pages@v4`) | 5 min ~~已修复~~ |
| 5 | 替换 `execCommand` 为 `navigator.clipboard` | 30 min ~~已修复~~ |
| 6 | CI 中加入 `npx gulp minify` 步骤 | 10 min ~~已修复~~ |
| 7 | Tag 插件 HTML 转义修复 | 2-4 h ~~已修复~~ |

---

## 四、主题 Stellar 后续核心优化方向

| 方向 | 说明 | 优先级 |
|------|------|--------|
| **安全加固** | 添加 CSP 头、全量审查 tag 插件 HTML 输出转义 | 高 |
| **性能优化** | CDN 依赖瘦身、CSS/JS 代码分割、字体子集化 | 高 |
| **测试覆盖** | 建立 CI 测试流水线、核心功能回归测试 | 高 |
| **Hexo 7+ 适配** | 验证所有 API 在 Hexo 7.x 下的兼容性 | 中 |
| ~~**PJAX 稳定化**~~ | ~~完成 pjax 模式的兼容性修复并正式发布~~（已废弃：PJAX 已于 2026-08-08 移除，见 [../designs/2026-08-08-pjax-removal.md](../designs/2026-08-08-pjax-removal.md)） | - |
| **TypeScript 迁移** | 将 scripts/ 下 JS 逐步迁移到 TS，提升可维护性 | 低 |
| **无障碍 (a11y)** | 检查 ARIA 标签、键盘导航支持 | 低 |

---

## 五、技术栈与依赖清单

### 站点 package.json

| 依赖 | 版本 | 用途 |
|------|------|------|
| hexo | ^7.0.0 | 静态站点生成器 |
| hexo-all-minifier | ^0.5.7 | 资源压缩（未启用） |
| hexo-autonofollow | ^1.0.1 | 外链 nofollow |
| hexo-deployer-git | ^4.0.0 | Git 部署 |
| hexo-generator-feed | ^3.0.0 | RSS/Atom Feed |
| hexo-generator-seo-friendly-sitemap | ^0.2.1 | SEO 站点地图 |
| hexo-renderer-ejs | ^2.0.0 | EJS 渲染器 |
| hexo-renderer-marked | ^6.2.0 | Markdown 渲染器 |
| hexo-renderer-stylus | ^3.0.1 | Stylus CSS 预处理器 |

### 主题 package.json

| 依赖 | 版本 | 用途 |
|------|------|------|
| cheerio | ^1.1.0 | HTML 解析 |
| hexo-renderer-ejs | ^2.0.0 | EJS 渲染 |
| hexo-renderer-stylus | ^3.0.1 | Stylus 渲染 |
| probe-image-size | ^7.2.3 | 图片尺寸探测 |
| glob（缺失） | - | 文件匹配（get_image_ratios.js） |

### 部署架构

```
GitHub Push → GitHub Actions (auto-deploy.yml)
  ├─ checkout + submodules
  ├─ npm i + hexo generate
  ├─ deploy to gh-pages (peaceiris/actions-gh-pages)
  └─ curl hook → 服务器 pull 更新
```

### CDN 资源依赖

| 资源 | CDN |
|------|-----|
| jQuery 3.7 | gcore.jsdelivr.net |
| Marked 13.0 | gcore.jsdelivr.net |
| Vanilla Lazyload 19.1 | gcore.jsdelivr.net |
| Fancybox UI 5.0 | gcore.jsdelivr.net |
| Swiper 10.3 | unpkg.com |
| KaTeX 0.16.23 | cdn.jsdelivr.net |
| MathJax 2.7.6 | cdnjs.cloudflare.com |
| Mermaid v9 | gcore.jsdelivr.net |
| Flying Pages 2 | gcore.jsdelivr.net |
| Highlight.js 11.9 | gcore.jsdelivr.net |

---

*报告生成时间：2026-08-08 | 分析工具：人工代码审查 + npm audit*
