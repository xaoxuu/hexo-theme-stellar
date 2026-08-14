---
title: AI 标签文案多语言化检查清单
date: 2026-08-15
---

# 检查清单 / 验证记录

## 验证

- [x] `npm run lint` 通过
- [x] `npm test` 通过（`ai_label` 单测已按新签名更新）
- [x] 主工程 `npm run g` 全量构建通过（涉及 `scripts/` 必做）
- [x] 页面类型覆盖：文章页（zh-CN / en / zh-TW 文案、banner 含图颜色）
- [x] `python3 docs/knowledge/tools/verify.py` 知识库硬事实核查通过

## 文档同步

- [x] `docs/knowledge/00-总览与安装配置/configuration.md` 已更新
- [x] `docs/knowledge/03-内容系统/content-overview.md` 已更新
- [x] `docs/knowledge/知识库全量.md` 已更新
- [x] `docs/knowledge/VERIFICATION.md` 已登记
- [x] 主工程 `source/wiki/stellar/advanced-settings.md`、`front-matter.md`、`docs/specs/ai-label/` 已同步
