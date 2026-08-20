---
title: Markdown Widget Collection 默认背景检查清单
date: 2026-08-20
---

# 检查清单 / 验证记录

## 验证

- [x] 主工程 `npm run g` 全量构建通过（生成 252 个文件，HTML/CSS/JS minify 完成）。
- [x] `python3 docs/knowledge/tools/verify.py` 知识库硬事实核查通过（行号异常 0、版本不一致 0）。
- [x] 生成 CSS 确认 markdown widget 在 glass surface 下覆盖 `--ui-item-bg: var(--bg-a10)`。
- [x] 生成 CSS 确认 markdown widget 默认覆盖 `--ui-item-bg: var(--block)`，适用于 card/sidebar/content 等非 glass surface。
- [x] 生成 CSS 保留普通 `[data-ui-surface]` 的 `--ui-item-bg: transparent`，未修改 hover/active、布局与图标规则。
- [x] 现有生成页面确认 glass 左栏、sidebar 右栏与 markdown 内嵌 collection DOM 均存在。

## 文档同步

- [x] 主题知识库与 `VERIFICATION.md` 已更新。
- [x] 主工程 Stellar Widget 文档已同步并刷新 `updated`。
