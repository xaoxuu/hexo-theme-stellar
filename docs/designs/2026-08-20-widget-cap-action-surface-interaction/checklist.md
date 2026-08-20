---
title: Widget Header Cap Action Surface 交互检查清单
date: 2026-08-20
---

# 检查清单 / 验证记录

## 验证

- [x] 主工程 `npm run g` 全量构建通过（生成 252 个文件，HTML/CSS/JS minify 完成）。
- [x] `python3 docs/knowledge/tools/verify.py` 知识库硬事实核查通过（行号异常 0、版本不一致 0）。
- [x] 生成 CSS 确认 cap action hover 背景消费 `--ui-item-bg-hover`。
- [x] 生成 CSS 确认 cap action hover 阴影消费 `--ui-item-shadow-hover`。
- [x] 源码差异确认 opacity、accent 文字/图标、按钮几何与 TOC 局部状态保持不变。

## 文档同步

- [x] 主题知识库与 `VERIFICATION.md` 已更新。
- [x] 主工程 Stellar 侧栏文档已同步并刷新 `updated`。
