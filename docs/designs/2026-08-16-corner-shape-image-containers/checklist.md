---
title: 图片容器跟随连续曲率圆角 检查清单
date: 2026-08-16
---

# 检查清单 / 验证记录

## 验证

- [x] 主工程 `npm run g` 全量构建通过（hexo generate + gulp minify）
- [x] 生成 CSS 中 `.post-card` / `.article.banner` 的 `clip-path` 位于 `@supports not (corner-shape: superellipse(1))` 内
- [x] Chrome 151 计算样式：`.post-card` / `.article.banner` `clip-path: none`，`background-image` 为封面/横幅 URL
- [x] Chrome 151 渲染：`.pin-slider` 自身背景为当前 slide 封面、封面 slide 背景透明；hero 卡片自身背景经红色探针确认在四角按圆角裁剪绘制（懒加载图片在无头环境不稳定，机制以计算样式 + 探针确认）
- [x] 回归：轮播滑动/自动播放/箭头、hero hover 放大与模糊层、横幅布局、无封面白卡
- [x] Safari/Firefox 回退：clip-path 兜底仍在（`@supports not` 守卫，未实测，逻辑保证）

## 文档同步

- [x] `docs/knowledge/` 对应领域已更新
- [x] `docs/knowledge/VERIFICATION.md` 已登记
- [x] 主仓库 `docs/specs/continuous-corner/` 与 `source/wiki/stellar/advanced-settings.md` 已更新
