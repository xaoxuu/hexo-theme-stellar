---
title: Collection Surface 交互统一检查清单
date: 2026-08-20
---

# 检查清单 / 验证记录

## 验证

- [x] 主工程 `npm run g` 全量构建通过（生成 252 个文件，HTML/CSS/JS minify 完成）。
- [x] `python3 docs/knowledge/tools/verify.py` 知识库硬事实核查通过（行号异常 0、版本不一致 0；既有未解析文件与配置键仅报告、不阻断）。
- [x] 浏览器检查：list/grid/summary 默认背景透明，非 glass hover/active 均为 `var(--block)`。
- [x] 浏览器检查：light/dark/auto 的 glass hover/active 保留 menubar 玻璃高亮，collection item 与 leading 图标的 transition duration 均为 `0s`。
- [x] 快速反复移入移出 summary 条目后高亮与计算样式正常；grid 激活圆点隐藏、list 激活圆点显示，focus-visible 与 adapter 规则不变。
- [x] 浏览器检查：collection 预览与实际 menubar/linklist 的未激活 SVG 均使用 `--text-p2` 且 `filter: none`；静态检查确认外部图片已无滤镜声明，保留原图颜色。
- [x] 浏览器检查：hover/active SVG 继续使用 `--item-theme`、`--theme` 或既有渐变，light/dark/auto 下状态一致。
- [x] 浏览器检查：collection 预览与实际 menubar/linklist 的未激活 `img` / `svg` 透明度为 `0.5`，hover/active 恢复为 `1`，且无 opacity 过渡。

## 文档同步

- [x] 主题知识库与 `VERIFICATION.md` 已更新。
- [x] 主工程 Stellar Wiki 已同步并刷新 `updated`。
