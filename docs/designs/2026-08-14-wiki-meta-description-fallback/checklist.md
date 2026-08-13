---
title: Wiki 项目描述兜底方案检查清单
date: 2026-08-14
---

# 检查清单 / 验证记录

## 验证

- [x] `npm run check` 通过（lint + 31 单测 + 依赖声明 + 知识库硬事实核查；未解析文件为既有警告）
- [x] 主工程 `npm run g` 全量构建通过（209 files）
- [x] 远程 wiki 页：`/wiki/feed-posts-parser/`、`/wiki/star-vote/` 的 meta description / og:description / JSON-LD description = 项目 YAML description
- [x] 本地 wiki 页：`/wiki/cloud-shell/`、`/wiki/prohud/` 描述取 YAML description，与卡片一致
- [x] 文章页 / 首页：描述不受影响（正文摘要 / 站点默认文案不变）

## 文档同步

- [x] `docs/knowledge/02-布局系统/head-seo.md` 已更新
- [x] `docs/knowledge/VERIFICATION.md` 已登记
- [x] 主仓库 `source/wiki/stellar/wiki-settings.md` 已同步
