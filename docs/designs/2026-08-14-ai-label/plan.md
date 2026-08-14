---
title: 文章 AI 成分标签执行计划
date: 2026-08-14
---

# 执行计划

## 实施步骤

1. [x] 主题代码：`scripts/lib/ai_label.js`、`scripts/helpers/ai_label.js`、`dateinfo.ejs`、`post_card.ejs`、`bread-nav.styl`、`_config.yml`
2. [x] 单测 `test/ai_label.test.js`
3. [x] 主题知识库与方案文档：`docs/knowledge/` 三处 + `VERIFICATION.md` + `docs/designs/2026-08-14-ai-label/`
4. [x] 主工程文档：`docs/specs/ai-label/`、`source/wiki/stellar/advanced-settings.md`、`front-matter.md`
5. [x] 验证：`npm run check`、`verify.py`、主工程 `npm run g`、页面抽查

## 风险与回退

- 未知 `ai` 值仅告警不渲染，不会破坏构建；配置缺失时 helper 返回空字符串
- 样式改动最小（仅 `.ai-label` 间距），回退时删除相关行即可
