---
title: 移除 weibo:comment，评论数图标统一使用 default:tocomment 执行计划
date: 2026-08-16
---

# 执行计划

## 实施步骤

1. [x] 方案演进：新增 `default:comment`（chat-line）→ 废弃；`weibo:comment` 素材改为 `default:tocomment` 同款 → 最终移除 `weibo:comment` 键
2. [x] `_data/icons.yml` 删除 `weibo:comment` 键
3. [x] 白名单与引用点改为 `default:tocomment`（stellar-icons.js / timeline.js / weibo.js）
4. [x] 知识库与主工程 wiki 文档同步
5. [x] 主工程 `npm run g` 构建并核对生成产物
6. [ ] 提交前登记 `docs/knowledge/VERIFICATION.md`（仅在用户要求提交时执行）

## 风险与回退

- 风险：站点侧覆盖过 `weibo:comment` 会失效——需改用 `default:tocomment`；回退即恢复 `weibo:comment` 键并改回引用。
