---
title: 主题基础功能图标键统一为 default:语义名 执行计划
date: 2026-08-15
---

# 执行计划

## 实施步骤

1. [x] `_data/icons.yml`：27 个 `solar:*` 基础键改名为 `default:语义名`，移除 `solar:pin-bold-duotone`，更新分区注释与文件头说明。
2. [x] 引用同步：layout/scripts/source/js/defines.ejs/head.ejs/_config.yml/test/icons.test.js 共 53 处。
3. [x] 知识库同步：post-lists-cards / article-footer-metadata / icon-tag / configuration / design-tokens / logo-navigation-headers / 知识库全量 / VERIFICATION。
4. [x] 验证：`npm run check`、主工程 `npm run g`、产物抽查。
5. [x] 修正：标签组件专用图标（comment/repeat/like/image-onerror）改用标签名命名空间 `weibo:*` / `image:onerror`，引用与文档同步，复查通过。
6. [x] 修正：剩余 `solar:*` 标签插件键（copy/download/hashtag-bold/hashtag-square-bold）改为 `copy:copy` / `image:download` / `hashtag:hashtag` / `quot:hashtag`，icons.yml 不再有 `solar:` 前缀。
7. [x] 修正：{% quot %} 分区 `ph:seal-question-fill`、`bxs:quote-left/right` 统一为 `quot:question` / `quot:quote-left` / `quot:quote-right`，icons.yml 不再有 `ph:`/`bxs:` 前缀。
8. [x] 修正：仅出现在 `_config.yml` 注释示例中的 `default:chat/planet/notebook` 改用 `example:` 命名空间（`example:chat/planet/notebook`）。

## 风险与回退

- 键重命名破坏站点级覆盖：已确认主工程无旧键覆盖；站点若使用旧键需同步改名。
- 误替换风险：替换为精确字符串匹配（`solar:xxx` 全名），已校验无重复键、无旧键残留。
