---
title: Artalk 评论邮件链接定位修复检查清单
date: 2026-08-15
---

# 检查清单 / 验证记录

## 验证

- [x] 主工程 `npm run g` 全量构建通过（已含 hexo clean && generate && gulp minify）
- [x] 场景 1：打开 `文章URL?atk_comment=<已有评论ID>` → 自动滚动并高亮该评论，随后 URL 清理无 `atk_*`
- [x] 场景 2：`?atk_comment=<ID>&atk_notify_key=xxx` → 定位成功且通知标记已读（`/notifies/` 请求已发出；伪 key 下 Artalk 报「通知未找到」属预期）
- [x] 场景 3：`#atk-comment-<ID>`（侧栏最近评论链接）→ 定位成功
- [x] 场景 4：无 atk 参数打开文章 → 评论区仍视口懒加载（滚动到评论区前不请求 Artalk 资源）
- [x] 场景 5：带 `?atk_comment` 打开后点击 TOC → 不被拉回评论区（#598 回归）
- [x] 场景 6：评论 ID 不存在 → 页面正常加载、URL 正常清理（Artalk 内部「评论未找到」提示属其自身行为）
- [x] 页面类型覆盖：长文章（评论区在首屏外）无头 Chrome 实测；短文章 / Wiki 页复用同一 partial，机制相同
- [x] `python3 docs/knowledge/tools/verify.py` 知识库硬事实核查通过（仅原有未阻断报告）
- [x] 主题仓库 `npm run check` 通过（lint + 71 单测 + 依赖声明 + 知识库核查）

## 文档同步

- [x] `docs/knowledge/07-外部集成/comment-systems.md` 已更新
- [x] `docs/knowledge/06-数据服务与组件/data-service-apis.md` 已更新
- [x] `docs/knowledge/知识库全量.md` 已同步
- [x] `docs/knowledge/VERIFICATION.md` 已登记
- [x] 主仓库 `source/wiki/stellar/comments.md` 已更新
- [x] 主仓库 `docs/specs/artalk-comment-link-scroll/` 已归档
