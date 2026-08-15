---
title: Artalk 评论邮件链接定位修复执行计划
date: 2026-08-15
---

# 执行计划

## 实施步骤

1. [x] 修改 `layout/_partial/comments/artalk/script.ejs`（懒加载绕过 + URL 规范化 + 事件驱动清理）
2. [ ] 同步主题知识库：`07-外部集成/comment-systems.md`、`06-数据服务与组件/data-service-apis.md`、`知识库全量.md`、`VERIFICATION.md`
3. [ ] `python3 docs/knowledge/tools/verify.py` 知识库硬事实核查
4. [ ] 主仓库：`docs/specs/artalk-comment-link-scroll/` 方案文档 + `source/wiki/stellar/comments.md` 更新
5. [ ] 主工程 `npm run g` 全量构建验证

## 风险与回退

- Artalk 实例事件 API（`artalk.on`）依赖 2.x 公开接口；若不生效可回退为 `Artalk.use(ctx => ctx.on('list-loaded', …))` 全局插件形式。
- URL 改写使用 `history.replaceState`，不影响页面内容与返回栈；其他 query 参数（utm 等）会被清理，与 #598 既有行为一致。
