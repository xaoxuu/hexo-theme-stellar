---
title: 移除置顶轮播区滑轮事件
date: 2026-08-12
status: 已实施
---

# 移除置顶轮播区滑轮事件 方案

## 1. 问题与目标

置顶内容轮播当前监听 `wheel` 事件：横向触控板（`deltaX`）与鼠标滚轮（`deltaY`）均会拦截滚动并切换幻灯片。轮播区域位于页面顶部，拦截鼠标滚轮会阻止用户正常上下滚动页面，与常见轮播交互习惯不一致。

目标：移除置顶轮播区的滚轮/触控板切换行为，滚动事件不再被轮播区域拦截，页面可正常滚动；其余交互（自动播放、圆点点击、触摸滑动、hover/focus 暂停）保持不变。

## 2. 技术方案

- 在 `layout/_partial/main/pin_slider.ejs` 中删除 `onWheel` 处理函数、`wheelCooldown` 冷却变量、`slider.addEventListener('wheel', ...)` 注册与清理函数中的对应移除逻辑。
- 不涉及样式与配置改动。

涉及文件：

- `layout/_partial/main/pin_slider.ejs`
- `docs/knowledge/05-前端交互/client-side-overview.md`、`docs/knowledge/知识库全量.md`、`docs/knowledge/VERIFICATION.md`

## 3. 影响范围

- 对外行为：置顶轮播区不再响应鼠标滚轮/触控板滚动，页面滚动不被拦截；触摸滑动、圆点点击、自动播放保留。
- 兼容性：无配置项变更，未开启轮播时无影响。

## 4. 验证方式

- UI 改动量小，按主题仓库规范无需自检流程；由用户通过 `npm run s` 预览验收。
