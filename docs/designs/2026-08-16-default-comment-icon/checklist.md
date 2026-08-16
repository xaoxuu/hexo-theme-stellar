---
title: 移除 weibo:comment，评论数图标统一使用 default:tocomment 检查清单
date: 2026-08-16
---

# 检查清单 / 验证记录

## 验证

- [x] 源码全文无 `weibo:comment` 引用（仅历史方案文档提及）
- [x] `_data/icons.yml` 无 `weibo:comment` 键，`default:tocomment` 保留
- [x] 客户端白名单（stellar-icons.js）与 timeline.js / weibo.js 均改用 `default:tocomment`
- [x] 主工程 `npm run g` 全量构建通过
- [x] `js/stellar-icons.js` 含 `default:tocomment`（chat-round-line 路径 `10.4606`），无 `weibo:comment`
- [x] `js/icons/weibo.json` 无 `weibo:comment` 键
- [x] 知识库 icon-tag.md 与主工程 wiki express.md 已同步

## 文档同步

- [x] `docs/knowledge/04-标签插件/icon-tag.md` 白名单与用途描述已更新
- [x] 主工程 `source/wiki/stellar/tag-plugins/express.md` weibo: 命名空间描述已更新
- [ ] `docs/knowledge/VERIFICATION.md` 提交登记（仅在用户要求提交时补充）
- [ ] `languages/` 无需改动
