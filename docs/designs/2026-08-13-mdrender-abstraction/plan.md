---
title: 远程 MD 渲染能力抽象 + Wiki README 主页 执行计划
date: 2026-08-13
---

# 执行计划

## 实施步骤

1. [x] 新增 `scripts/lib/mdrender_html.js`：底层通用组件（占位生成、GitHub raw 识别/镜像替换、`data-base`，无应用逻辑）
2. [x] 新增 `scripts/lib/wiki_readme.js`：wiki 应用层（`readmeUrl` / `isEmptyContent` / `isWikiReadmePage` / `wikiReadmeHtml`）
3. [x] 新增 `scripts/helpers/mdrender.js`：注册 `mdrender_html` / `wiki_readme_html` / `has_remote_md`（config 注入）
4. [x] `scripts/tags/lib/md.js` 与 `layout/_partial/widgets/markdown.ejs` 改为复用底层生成器
5. [x] 重构 `source/js/services/mdrender.js`：replace 原地替换、`data-base` 相对 URL 解析、`data-heading` 标题适配、渲染后派发 `stellar:mdrender` 事件
6. [x] `layout/page.ejs` 用 `wiki_readme_html`，`toc.ejs` 用 `has_remote_md`，删除 `page.__mdrender` 魔法标记
7. [x] `source/js/main.js` 迁入 TOC 重建与点击绑定，监听 `stellar:mdrender`
8. [x] 新增 `test/mdrender.test.js` 单测并通过
9. [x] 同步 `docs/knowledge/03-内容系统/wiki-docs.md` 与 `VERIFICATION.md`
10. [x] 主工程 `npm run g` 全量构建验证（含 `/wiki/star-vote/` 占位与 md 标签输出核验）
11. [x] md 标签新增可选 `wrap` 参数（默认 true，`wrap:false` 输出无容器模式），补单测并同步文档

## 风险与回退

- 客户端 slug 规则与 hexo-util 存在边缘差异（未做 diacritic 归一化）：常见标题不受影响，单测已锁定核心规则。
- 若构建发现模板/服务问题，可回退为：保留旧 `md.js` 直接输出占位、`markdown.ejs` 保留原内联 div（不影响 wiki 触发功能）。
