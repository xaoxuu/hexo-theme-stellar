---
title: SEO 元数据修复
date: 2026-08-15
status: 已实施
---

# SEO 元数据修复 方案

## 1. 问题与目标

主工程 SEO 审计发现以下主题侧问题：

- wiki 页面 `<title>` 重复拼接 wiki 项目名（如 `GHAPI JSON Generator：GHAPI JSON Generator - XAOXUU`）。
- 文章页 `og:site_name` 被替换为文章标题，违反 Open Graph 语义。
- 无封面/横幅/相册的文章 JSON-LD `image: []`（22 篇），且 `images.unshift()` 返回值误赋给数组变量，有封面时 `image` 字段会变成数字。
- 无 `<!-- more -->` 的文章 JSON-LD `description: ""`（12 篇）。
- 首页分页页（page/2+）`<title>` 与首页相同，构成近似重复页。

成功标准：上述问题修复后，文章页与 wiki 页的结构化数据、OG 标签、标题输出符合规范。

## 2. 技术方案

- 新增纯函数库 `scripts/lib/seo.js`：`firstContentImage()`（同标签内优先 `data-src` 再 `src`）、`postImages()`（封面→横幅→相册→正文首图→默认封面）、`postDescription()`（摘要优先，回退正文前 200 字符）；配套单测 `test/seo.test.js`。
- 新增 helper `scripts/helpers/seo.js`：注册 `first_content_image` 供模板调用。
- `scripts/helpers/json_ld.js`：改用 `postImages()` / `postDescription()`，修复 unshift 赋值 bug。
- `layout/_partial/head.ejs`：
  - `strip_wiki_title()` 去重 wiki 标题前缀（`：`/`:`/` - `，大小写不敏感），无剩余标题时只输出 wiki 名。
  - 首页分页（`is_home() && page.current > 1`）标题追加 `symbol.page` 文案。
  - `generate_og_site_name()` 恒返回站点名。
  - `og_args()` 图片按 封面→横幅→正文首图→头像 回退。
- `languages/*.yml`：新增 `symbol.page`（zh-CN / en / zh-TW）。

## 3. 影响范围

- 行为变更：wiki 页标题、分页页标题、文章页 og:site_name、JSON-LD image/description、og:image 回退。
- 兼容性：无配置项新增；未设置封面/横幅且正文无图时回退 `theme.default.cover`，无默认封面则保持空数组。
- 需同步：`docs/knowledge/02-布局系统/head-seo.md`、`VERIFICATION.md`、主工程 `source/wiki/stellar/seo-settings.md`。

## 4. 验证方式

- 单测：`node --test test/seo.test.js`。
- 全量验证：主工程 `npm run g`，抽查首页/文章页/wiki 页/分页页渲染结果。
- 知识库硬事实核查：`python3 docs/knowledge/tools/verify.py`。
