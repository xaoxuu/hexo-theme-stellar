---
title: AI 标签文案多语言化执行计划
date: 2026-08-15
---

# 执行计划

## 实施步骤

1. [x] `languages/` 三个语言文件新增 `meta.ai_label.*` 四档文案
2. [x] `_config.yml` 移除各档 `text`，更新注释
3. [x] `scripts/lib/ai_label.js` 文案改为参数传入；`scripts/helpers/ai_label.js` 经 `__()` 解析多语言文案
4. [x] `test/ai_label.test.js` 同步新签名，覆盖缺失文案返回空
5. [x] 同步 `docs/knowledge/`（configuration / content-overview / 全量 / VERIFICATION）
6. [ ] 主工程 `npm run g` 全量构建验证，抽查多语言文章页
7. [x] 同步主工程 `source/wiki/stellar/` 与 `docs/specs/ai-label/`

## 风险与回退

- 风险：语言文件缺 key 时标签不渲染；回退为补齐语言文件或恢复配置 `text`。
- 风险：`__()` 在 helper 内的 `this` 绑定；使用 Hexo 8 `locals.__` 绑定（`this.__`），并保留 `hexo.theme.i18n` 回退。
