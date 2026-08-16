---
title: 图片容器跟随连续曲率圆角 执行计划
date: 2026-08-16
---

# 执行计划

## 实施步骤

1. [x] `layout/index.ejs`：hero 卡片 `.post-card` 内联 `--cover-url`
2. [x] `source/css/_components/list.styl`：`.post-card` / topic `.cover` 自身背景 + `@supports not (corner-shape: ...)` 守卫 clip-path
3. [x] `source/css/_components/partial/article-banner.styl`：横幅自身背景 + clip-path 守卫（含模糊伪元素）
4. [x] `source/css/_components/tag-plugins/banner.styl`：banner 标签自身背景
5. [x] `layout/_partial/main/pin_slider.ejs` + `source/css/_components/pin-slider.styl`：轮播容器自身背景 + 封面 slide 透明
6. [x] 主工程 `npm run g` 构建验证 + Chrome 151 预览核查
7. [x] 同步 `docs/knowledge/` 与 `VERIFICATION.md`；主仓库 `docs/specs/continuous-corner/` 与 `source/wiki/stellar/advanced-settings.md` 更新

## 风险与回退

- Chromium 子内容裁剪不跟随 corner-shape：通过容器自身背景承载规避，子图保留保证 hover 行为不回退。
- `@supports` 守卫在 Stylus 中输出位置：构建后核查生成 CSS。
- 经典 `.post-cover` 顶部封面角落仍为普通圆角（Chromium 限制），站点使用 hero 布局不受影响。
