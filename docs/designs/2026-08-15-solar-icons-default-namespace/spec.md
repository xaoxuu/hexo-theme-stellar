---
title: default 命名空间图标统一替换为 Solar（含键重命名）
date: 2026-08-15
status: 已实施
---

# default 命名空间图标统一替换为 Solar 方案

## 1. 问题与目标

`_data/icons.yml` 中 `default:` 命名空间的图标来源混杂（iconfont、Material、Solar 旧版路径），与已确立的 Solar bold-duotone 主视觉不统一；键名 `default:xxx` 是语义名而非图标名，无法从键名判断实际图标。

目标：

- 17 个 `default:*` 键替换为当前版 Solar bold-duotone 图标，键名同步改为 Solar 图标原名（`solar:alt-arrow-left-bold-duotone` 等），与现有 `solar:*` 键风格一致。
- `default:search`（三态着色依赖 `p-id="1562"`）、`default:rss`（经典 RSS 视觉）、`default:leftbar/rightbar`（`path#sep` 位移动画）、`default:loading-spinner`（自带旋转动画）、`default:loading-placeholder`（外部 URL）保留原键。
- 全部引用点、知识库同步更新。

成功标准：`layout/`、`scripts/`、`source/js/`、`_config.yml` 中不再出现已迁移的 `default:*` 键；`npm run check` 与主工程 `npm run g` 通过。

## 2. 技术方案

### 键映射

| 旧键 | 新键（Solar 原名） |
|---|---|
| default:goback | solar:alt-arrow-left-bold-duotone |
| default:edit | solar:pen-new-round-bold-duotone |
| default:theme | solar:moon-stars-bold-duotone |
| default:upup | solar:double-alt-arrow-up-bold-duotone |
| default:tocomment | solar:chat-round-line-bold-duotone |
| default:calendar | solar:calendar-bold-duotone |
| default:category | solar:folder-2-bold-duotone |
| default:pin | solar:pin-bold-duotone |
| default:bookmark.active | solar:bookmark-bold-duotone |
| default:loading | solar:refresh-bold-duotone |
| default:comment | solar:chat-square-bold-duotone |
| default:warning | solar:danger-triangle-bold-duotone |
| default:copy | solar:copy-bold-duotone |
| default:download | solar:download-bold-duotone |
| default:hashtag | solar:hashtag-bold-duotone |
| default:image-onerror | solar:gallery-remove-bold-duotone（data-URI 重编码，保留红色 #F44336） |

保留：`default:search`、`default:rss`、`default:leftbar`、`default:rightbar`、`default:loading-spinner`、`default:loading-placeholder`。

### 实现要点

- SVG 从 Iconify Solar 集合取当前版 body，统一 `width="32" height="32" viewBox="0 0 24 24"` 与 Solar CC BY 4.0 注释。
- 保留关键 class：`refresh-bold-duotone` 带 `class="loading"`（CSS 旋转动画依赖）；`bookmark-bold-duotone` 带 `class="active-icon"`；`copy/download/hashtag` 保留原 class。
- 引用点只改字符串不改逻辑：评论系统 6 个 partial、TOC/menubtn、sidebar、recent、post_card/note_card/categories、contributors、widgets、`scripts/tags/lib/`、`source/js/services/`、`defines.ejs` 白名单。
- `defines.ejs` 客户端白名单更新为：`solar:chat-square-bold-duotone`、`default:loading-spinner`、`solar:danger-triangle-bold-duotone`、`solar:repeat-bold`、`solar:like-bold`；`loading` 兼容回退仍读 `default:loading-placeholder`。
- `_config.yml` 的 `image_onerror` 注释键改为 `solar:gallery-remove-bold-duotone`。

涉及文件：`_data/icons.yml`、`layout/`（comments/toc/menubtn/sidebar/widgets/post_card/note_card/categories/contributors/defines.ejs）、`scripts/tags/lib/`（about/banner/copy/hashtag/image）、`source/js/services/`（weibo/timeline）、`_config.yml`、`docs/`。

## 3. 影响范围

- 对外行为：默认图标视觉统一为 Solar bold-duotone（`default:warning` 原描边动画效果不再保留；`default:loading` 由 `svg.loading` CSS spin 提供旋转）。
- 兼容性（破坏性）：键重命名后，站点级 `source/_data/icons.yml` 覆盖若使用旧 `default:*` 键需同步改名；已确认主工程无此类覆盖。
- `default:theme`、`default:pin` 当前零引用，仍按规则替换，供站点自行覆盖。
- 需要同步的知识库：`04-标签插件/icon-tag.md`、`03-内容系统/post-lists-cards.md`、`00-总览与安装配置/configuration.md`、`知识库全量.md`、`VERIFICATION.md`。

## 4. 验证方式

- 主题仓库 `npm run check`（lint + 单测 + 依赖声明 + 知识库硬事实核查；icons.yml 键完整性单测自动校验新旧引用）。
- 主工程 `npm run g` 全量构建（`scripts/` 有改动）。
- 页面抽查：评论系统 loading、TOC 回顶/评论/右栏、复制按钮、hashtag、图片下载、分类页与文章卡片日期/分类、recent 订阅、侧边栏 logo/搜索、weibo/timeline 评论气泡、异步加载 spinner/警告。
