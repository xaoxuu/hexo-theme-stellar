---
title: Hexo 8 兼容适配方案
date: 2026-08-12
status: 已实施
---

# Hexo 8 兼容适配方案

## 1. 问题与目标

- 主工程（xaoxuu.com）与主题需要适配 Hexo 最新版本（8.1.2，要求 Node >= 20.19），并保持渲染行为稳定。
- 成功标准：主工程 `npm run g` 全量构建零报错；升级前后的输出差异均可解释、可分类；页面抽查与服务冒烟通过；主题知识库与 CI 同步到已验证的 Hexo 8 环境。

## 2. 技术方案

- 主工程依赖升级：`hexo` ^8.1.2、`hexo-renderer-marked` ^7.0.1、`hexo-generator-index` ^4.0.0、`hexo-generator-feed` ^4.0.0；其余插件（archive/category/tag、server、ejs、stylus、deployer-git、autonofollow、seo-friendly-sitemap、mermaid）保持不变。
- 主题代码无需修改：已核查 `toc()`/`hexo-util` 4 的 API 兼容性；Hexo 8.1.0 的 TOC 锚点 `encodeURI` 变化与主题前端 hash 解码逻辑兼容（升级后 TOC 锚点集合与基线完全一致）。
- marked 15 严格 CommonMark：`**文案：**汉字` 形式（闭合 `**` 前为标点、后为汉字）不再解析为加粗。主工程扫描到 7 处（`20260116 - 2025OKR复盘.md`），改写为等价的 `<strong>文案：</strong>汉字`，渲染结果与升级前一致。
- Hexo 8 对无 front-matter 日期的页面改用文件 mtime 作为日期来源（原为 ctime），属上游行为修正；正常 git 检出（ctime==mtime）下无感知差异。
- 涉及文件：主工程 `package.json`/`package-lock.json` 与 `source/_posts/2026/20260116 - 2025OKR复盘.md`；主题仓库 `docs/`、`.github/workflows/ci.yml`。
- 需同步的知识库页面：`docs/knowledge/00-总览与安装配置/installation.md`、`docs/knowledge/09-高级主题/advanced-overview.md`、`docs/knowledge/知识库全量.md`、`docs/knowledge/VERIFICATION.md`。

## 3. 影响范围

- 对外行为：
  - `atom.xml` 由 hexo-generator-feed 4（Feedsmith）生成，XML 结构有调整（元素顺序、`<summary>` 改 CDATA、新增 `<rights>`、`<category>` 带 scheme、entry 内嵌 author），仍为标准 Atom。
  - `article:tag` 元数据排序变化（Hexo 8.0 open_graph 标签排序修复）。
  - 无 front-matter 日期页面的日期来源由 ctime 改为 mtime。
  - `<meta name="generator" content="Hexo 8.1.2">`。
- 兼容性：Node >= 20.19（主题 README 仍推荐 >=22）。
- 需同步的文档：见 §2。

## 4. 验证方式

- 主工程 `npm run g`（hexo clean + generate + gulp minify）零报错。
- 与 Hexo 7.3.0 基线（临时目录重建，同主题提交、同站点内容）做文件清单与哈希对比；归一化时间戳后逐项分类差异。
- 页面抽查：首页、Wiki 页（含 TOC）、博文、归档/分类/标签、`search.json`；`xmllint` 校验 `atom.xml`/`sitemap.xml`。
- `hexo server` 冒烟：服务启动后 curl 关键页面均 200。
- 主题仓库 `npm run check`（lint + 单测 + 知识库硬事实核查）。
