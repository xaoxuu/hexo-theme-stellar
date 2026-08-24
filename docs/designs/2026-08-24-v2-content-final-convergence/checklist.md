---
title: v2 Content、Collection 与 Front Matter 最终收敛验收
date: 2026-08-24
---

# 验收清单

- [x] Article 最终命名、整数、share、tags 与 related posts 语义通过。
- [x] AI label 全局样式删除，内容等级枚举通过。
- [x] Notebook 分页、排序、标签图标与 footer 继承/关闭语义通过。
- [x] Collection、Front Matter、模型、生成器和渲染消费链同步。
- [x] Blueprint、Reference、doctor、知识库与公开 Wiki 同步。
- [x] Node.js 22 下 `npm run check` 通过（364 项测试、Reference、首屏 gzip 与知识库门禁）。
- [x] 主工程 Node.js 22 下 `npm run g` 通过（262 个生成文件）。

# 验证证据

- Node.js：`22.23.2`。
- `npm run check`：通过；首屏核心 JS gzip `18,643` bytes，相对 v1 `34,937` bytes 降低 `46.64%`。
- 主工程 `npm run g`：通过；首页、Post、Wiki、Topic、Notebook、404 与 `search.json` 均生成。
- `doctor`：显式断言 `type → style`、`indent → paragraph_indent`、`related_posts → related_posts_limit`、`order_by → sort` 的来源化迁移目标。
