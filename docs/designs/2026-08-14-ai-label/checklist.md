---
title: 文章 AI 成分标签检查清单
date: 2026-08-14
---

# 检查清单 / 验证记录

## 验证

- [x] `npm run lint` 通过
- [x] `npm test` 通过（新增纯函数单测 8 例）
- [x] 在主工程执行 `npm run g` 全量构建通过（涉及 `scripts/` 必做）
- [x] 页面类型覆盖：文章页（顶部面包屑行最右）/ 首页列表卡片（不显示）/ 未标记文章不渲染
- [x] `python3 docs/knowledge/tools/verify.py` 知识库硬事实核查通过（顺带修正存量版本号 1.39.1 → 1.40.0）

## 文档同步

- [x] `docs/knowledge/` 对应领域已更新（configuration / content-overview / post-lists-cards）
- [x] `docs/knowledge/VERIFICATION.md` 已登记
- [x] 主工程 `source/wiki/stellar/` 文档已更新
