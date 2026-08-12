---
title: Hexo 8 兼容适配检查清单
date: 2026-08-12
---

# 检查清单 / 验证记录

## 验证

- [x] 主工程 `npm run g` 全量构建通过（204 文件，minify 无报错，仅既有 `fs.Stats` DeprecationWarning）
- [x] 与 Hexo 7.3.0 基线对比：文件清单一致；归一化后差异均分类为预期变化（generator 版本、open_graph 标签排序、feed 4 结构、ctime→mtime 日期来源）
- [x] marked 15 加粗失效 7 处已修复并复验（文章页 `<strong>复盘：</strong>` 正常、首页摘录恢复、全站字面 `**` 数量与基线一致）
- [x] 页面抽查：首页 / Wiki（含 TOC）/ 博文 / 归档 / 分类 / 标签 / `search.json`；TOC 锚点集合与基线一致
- [x] `xmllint` 校验 `atom.xml` / `sitemap.xml` / `page-sitemap.xml`；`JSON.parse` 校验 `search.json`
- [x] `hexo server` 冒烟：`/`、`/wiki/stellar/`、`/blog/20260116/`、`/atom.xml`、`/search.json` 均 200
- [x] 主题仓库 `npm run check`（lint + 单测 + verify.py）通过
- [ ] 浏览器兼容性检查（无前端行为变更，发布前如需可补充）

## 文档同步

- [x] `docs/knowledge/00-总览与安装配置/installation.md` 已更新（Hexo 已验证至 8.1.2）
- [x] `docs/knowledge/09-高级主题/advanced-overview.md` 已更新
- [x] `docs/knowledge/知识库全量.md` 已同步
- [x] `docs/knowledge/VERIFICATION.md` 已登记
- [x] README.md 环境要求已更新
- [ ] `languages/` 文案（无新增文案，不适用）
