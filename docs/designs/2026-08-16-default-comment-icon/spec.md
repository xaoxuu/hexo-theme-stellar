---
title: 移除 weibo:comment，评论数图标统一使用 default:tocomment
date: 2026-08-16
status: 已实施
---

# 移除 weibo:comment 方案

## 1. 问题与目标

- 问题：`weibo:comment` 是与 `default:tocomment` 完全同素材的冗余键；微博/时间线页脚评论数图标应直接使用通用键 `default:tocomment`（右栏「参与讨论」同一图标）。
- 目标：移除 `weibo:comment` 键，timeline/weibo 页脚评论数改读 `ctx.icons['default:tocomment']`，消除冗余、统一素材。
- 成功标准：源码与构建产物均无 `weibo:comment`；客户端白名单含 `default:tocomment`；`npm run g` 通过；页脚评论数图标渲染不变。

## 2. 技术方案

- `_data/icons.yml`：删除 `weibo:comment` 键及其注释。
- `scripts/generators/stellar-icons.js`：客户端白名单 `weibo:comment` → `default:tocomment`。
- `source/js/services/timeline.js`、`source/js/services/weibo.js`：`ctx.icons['weibo:comment']` → `ctx.icons['default:tocomment']`。
- 文档同步：`docs/knowledge/04-标签插件/icon-tag.md`（白名单键与用途描述）、主工程 `source/wiki/stellar/tag-plugins/express.md`（weibo: 命名空间描述去掉「评论」）。
- 涉及文件：`_data/icons.yml`、`scripts/generators/stellar-icons.js`、`source/js/services/timeline.js`、`source/js/services/weibo.js`、`docs/`、`docs/designs/2026-08-16-default-comment-icon/`。

## 3. 影响范围

- 对外行为：页脚评论数图标视觉不变（仍是 chat-round-line）；仅内部键从 `weibo:comment` 变为 `default:tocomment`。
- 兼容性：站点若在 `source/_data/icons.yml` 覆盖过 `weibo:comment` 将不再生效（主题已无该键），需改用 `default:tocomment` 覆盖。

## 4. 验证方式

- 源码全文检索无 `weibo:comment`。
- 构建产物 `js/stellar-icons.js` 含 `default:tocomment`，`js/icons/weibo.json` 无 `weibo:comment` 键。
- 主工程 `npm run g` 全量构建通过。
