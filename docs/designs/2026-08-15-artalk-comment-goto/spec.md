---
title: Artalk 评论邮件链接定位修复
date: 2026-08-15
status: 已通过
---

# Artalk 评论邮件链接定位修复

## 1. 问题与目标

- 问题：Artalk 邮件通知链接（`?atk_comment=<id>`，常带 `atk_notify_key`）打开文章页不会滚动到评论区；侧栏「最近评论」的 `#atk-comment-<id>` 链接同样失效。
- 根因 1：评论区视口懒加载（`util.viewportLazyload`）使 Artalk 仅在容器进入视口后才初始化。邮件链接打开页面停在顶部、评论区在首屏外时 Artalk 永不初始化，其 `list-loaded → list-goto` 自动定位逻辑不执行。
- 根因 2：1.40.0 修复 #598 的 300ms 固定延时清理 `?atk_*` 与 Artalk 在 `list-loaded` 时重新读取查询参数存在竞态：清理过早会让 Artalk 拿不到 `atk_comment`（无法滚动）和 `atk_notify_key`（无法标记已读）。
- 成功标准：带 atk 定位目标的链接打开页面后自动滚动到目标评论并高亮；随后 URL 中 `atk_*` 参数被清理；无目标时保持视口懒加载不变；TOC 跳转不被拉回评论区（#598 回归）。

## 2. 技术方案

- `layout/_partial/comments/artalk/script.ejs`（唯一代码改动）：
  1. 检测定位目标：`/[?&]atk_comment=\d+/`（查询参数）或 `/#atk-comment-\d+/`（hash）。
  2. 命中目标时跳过视口懒加载：`util.viewportLazyload(el, load_artalk, !hasAtkTarget)`；未命中时行为不变。
  3. `Artalk.init` 前规范化 URL：存在 `?atk_comment=<id>` 且无 `#atk-comment-` hash 时，`history.replaceState` 改写为 `pathname + (?atk_notify_key=…) + #atk-comment-<id>`。Artalk 读取优先级 hash > query，定位不再受后续 URL 清理影响；同时立即移除 `atk_comment`，无竞态解决 #598；保留 `atk_notify_key` 供已读回执。
  4. 初始化后注册 `artalk.on('list-loaded')`：在 `setTimeout(0)` 中清理残留 `?atk_*` 参数，此时 Artalk 的定位与已读回执处理器已执行完毕。
- 无配置项、无新依赖、无公开 API 变化。

## 3. 影响范围

- 对外行为：带 atk 定位目标的链接打开时评论区跳过视口懒加载立即初始化；URL 最终清理为 `pathname#atk-comment-<id>`（无残留查询参数）；无目标时行为不变。
- 兼容性：完全向后兼容；其他评论系统（waline/twikoo/giscus 等）不受影响。
- 需同步文档：`docs/knowledge/07-外部集成/comment-systems.md`（懒加载流程补充 atk 目标例外）、`docs/knowledge/06-数据服务与组件/data-service-apis.md`（#598 描述更新为事件驱动清理）、`docs/knowledge/知识库全量.md`、`docs/knowledge/VERIFICATION.md`；主仓库 `source/wiki/stellar/comments.md` 与 `docs/specs/artalk-comment-link-scroll/`。

## 4. 验证方式

- 主工程 `npm run g` 全量构建通过。
- 无头 Chrome / 手动验证场景（详见 checklist.md）：query 定位、query+notify_key 定位与已读回执、hash 定位、无目标懒加载不变、TOC 回归、无效 ID 兜底。
