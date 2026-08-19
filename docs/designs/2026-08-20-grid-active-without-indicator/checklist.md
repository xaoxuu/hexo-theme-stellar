---
title: Grid 集合激活态移除圆点检查清单
date: 2026-08-20
---

# 检查清单 / 验证记录

## 验证

- [x] 主工程 `npm run g` 全量构建通过（生成 252 个文件，HTML/CSS/JS minify 完成）。
- [x] `python3 docs/knowledge/tools/verify.py` 知识库硬事实核查通过（行号异常 0、版本不一致 0；既有未解析文件与配置键仅报告、不阻断）。
- [x] 开发预览含 active grid 条目，可与 active list 条目对照。
- [x] 静态检查：grid indicator 隐藏，`.is-active`、`aria-current` 与其它激活反馈未修改；list indicator 规则未修改。
- [x] 浏览器检查：四种 surface 的 active grid indicator 均为 `display: none`，active list indicator 为 `display: block`；实际 `/about/` grid linklist 行为一致。

## 文档同步

- [x] `docs/knowledge/06-数据服务与组件/widget-architecture.md` 已更新。
- [x] `docs/knowledge/VERIFICATION.md` 已登记。
- [x] 主工程 `source/wiki/stellar/` 已同步并刷新 `updated`。
