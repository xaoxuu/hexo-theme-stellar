---
title: 移除 poster 配置检查清单
date: 2026-08-16
---

# 检查清单 / 验证记录

## 验证

- [x] 在主工程执行 `npm run g` 全量构建通过
- [x] 产物结构核验：hero 卡片输出 `position="bottom"` 的 `.cover` / `.cover-info`，无 `text.topic`、无 `position="top"`；置顶轮播输出 title + 单行小字
- [x] `subtitle()` helper 单测通过（`node --test test/subtitle.test.js`：取值优先级 / HTML 剥离 / 空白压缩 / 50 字截断 / 空值）
- [x] `python3 docs/knowledge/tools/verify.py` 知识库硬事实核查通过（行号异常 0 / 版本不一致 0）
- [x] `rg -n "poster" source/` 主仓库内容无 poster 残留（`{% posters %}` 标签与历史文档除外）
- [ ] 浏览器视觉检查待用户 `npm run s` 预览验收：首页 hero 卡片（底部文字区、标题 + 单行小字）/ 无 cover 文章 classic 卡片 / 置顶轮播 / 专栏与归档页 / 文章页 banner；核对文字自适应颜色、移动端单行省略

## 文档同步

- [x] `docs/knowledge/00-总览与安装配置/configuration.md` 已更新（`card_style` 配置行）
- [x] `docs/knowledge/03-内容系统/post-lists-cards.md` 已更新（hero 卡片章节改写）
- [x] `docs/knowledge/05-前端交互/client-side-overview.md` 已更新（轮播取值文案）
- [x] `docs/knowledge/知识库全量.md` 已同步
- [x] `docs/knowledge/VERIFICATION.md` 已登记
- [x] 主仓库 `docs/specs/remove-poster-card-style/` 方案归档、`source/wiki/stellar/` 文档同步并刷新 `updated`
