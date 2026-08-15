---
title: 移除已失效的 auto_banner（Unsplash 自动横幅）功能
date: 2026-08-16
status: 已实施
---

# 移除已失效的 auto_banner（Unsplash 自动横幅）功能 方案

## 1. 问题与目标

### 要解决的问题

- `article.auto_banner` 配置已失效：实现该逻辑的 `layout/_partial/cover/post_cover.ejs` 自 2024-01（`0cab2f1`）起被停用，现行文章页横幅由 `layout/_partial/main/navbar/article_banner.ejs` 渲染，且不读取该配置。
- 底层图片源 `https://source.unsplash.com/` 已被 Unsplash 官方下架（当前返回 503），即使恢复代码路径也无法加载图片。
- 同源的 `auto_cover` 配置已于 2025-06（`03ecf1c`）移除，但留下了死代码与过时文档（`post_card.ejs` 中的 Unsplash 兜底、知识库中的 auto_cover/auto_banner 描述）。

### 成功标准（可验收的行为）

- 主题 `_config.yml` 不再包含 `article.auto_banner` 配置项。
- 已删除不再被引用的 `post_cover.ejs`，`cover/index.ejs` 无残留引用。
- 文章列表卡片仅在 `post.cover` 为完整 URL 时渲染封面，不再生成任何 Unsplash 图片地址。
- 知识库与合并版文档中不再出现 auto_banner / auto_cover 的失效描述，`VERIFICATION.md` 已登记。
- 主工程 `npm run g` 与主题 `npm run check` 通过；站点对外行为不变（显式 `banner:` / `cover:` URL 正常渲染）。

## 2. 技术方案

- 删除 `_config.yml` 中 `article.auto_banner` 键及其注释（保留同段其他配置不变）。
- 删除 `layout/_partial/cover/post_cover.ejs`，并清理 `layout/_partial/cover/index.ejs` 中对应的注释行。
- 简化 `layout/_partial/main/post_list/post_card.ejs`：移除 `theme.article.auto_cover` 判断与 `source.unsplash.com` 关键词/随机图兜底，封面仅在 `post.cover` 存在且为完整 URL 时渲染。
- 同步更新知识库 `docs/knowledge/`（configuration.md、content-overview.md、post-lists-cards.md、知识库全量.md）与 `VERIFICATION.md`。
- 涉及文件：`_config.yml`、`layout/_partial/cover/index.ejs`、`layout/_partial/cover/post_cover.ejs`（删除）、`layout/_partial/main/post_list/post_card.ejs`、`docs/knowledge/*`。

## 3. 影响范围

- 对外行为：无变化。当前站点所有 `banner:` / `cover:` 均为完整 URL；auto_banner 已长期不生效，auto_cover 配置已不存在。
- 配置项：移除 `article.auto_banner`（非破坏性，此前已不生效）。
- 需要同步的知识库页面：`docs/knowledge/00-总览与安装配置/configuration.md`、`docs/knowledge/03-内容系统/content-overview.md`、`docs/knowledge/03-内容系统/post-lists-cards.md`、`docs/knowledge/知识库全量.md`。
- 主仓库（xaoxuu.com）站内 wiki 未提及 auto_banner，无需内容改动；后续仅更新子模块指针。

## 4. 验证方式

- 主题仓库：`npm run check`（lint + 单测 + 依赖声明检查 + 知识库硬事实核查）。
- 主工程：`npm run g` 全量构建，确认无对已删 partial 的引用，首页、文章页、列表页渲染正常。
- 抽查场景：有 `banner:` URL 的文章页横幅正常；无 banner 的文章页显示纯文字横幅；列表卡片对无 `cover` 的文章不渲染封面，对有 URL cover 的文章正常渲染。
