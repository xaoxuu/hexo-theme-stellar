---
title: 置顶轮播文章大标题单行省略
date: 2026-08-12
status: 已实施
---

# 置顶轮播文章大标题单行省略 方案

## 1. 问题与目标

置顶轮播文章卡片的大标题（`.pin-slide-headline`）目前可换行显示，长标题会撑高文字区，影响卡片观感。

目标：大标题只显示一行，超出部分以省略号截断；小字（caption）行为不变。

## 2. 技术方案

- `source/css/_components/pin-slider.styl`：`.pin-slide-headline` 增加 `white-space: nowrap` + `overflow: hidden` + `text-overflow: ellipsis`，与 `.pin-slide-caption` 的单行省略方式一致。

涉及文件：

- `source/css/_components/pin-slider.styl`
- `docs/knowledge/VERIFICATION.md`

## 3. 影响范围

- 对外行为：文章卡片大标题超长时单行显示并以省略号截断，移动端字号不变。
- 兼容性：纯样式改动，不影响结构与其他交互。

## 4. 验证方式

- UI 改动量小，按主题仓库规范无需自检流程；由用户通过 `npm run s` 预览验收。
