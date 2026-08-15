---
title: 移动端侧边栏悬浮按钮图标改 outline 风格
date: 2026-08-15
status: 已回退
---

# 移动端侧边栏悬浮按钮 outline 图标方案

## 1. 问题与目标

移动端侧边栏悬浮按钮（`layout/_partial/menubtn.ejs` 的 float-panel 左右栏 toggle）目前使用 bold-duotone 图标，与标签前缀等已切换的 outline 风格不一致。

目标（已回退）：两个悬浮按钮图标曾尝试换成 Solar outline 变体，但因 outline/duotone 图标均不含原 SVG 的 `path#sep`，侧边栏弹出时的分隔线位移动画（`device.styl` 的 `trans1 transform` + `translateX(2px)`）丢失，最终还原为 `default:leftbar` / `default:rightbar` 原键原值。

## 2. 技术方案

- `_data/icons.yml`：曾新增 `solar:sidebar-outline` / `solar:sidebar-minimalistic-outline`，已随回退移除；恢复 `default:leftbar`（含 `id="sep"`）与 `default:rightbar`。
- `layout/_partial/menubtn.ejs`：已改回 `default:leftbar` / `default:rightbar`。
- TOC 头部右上角折叠按钮改为复用 `default:rightbar`（与悬浮右栏按钮一致），移除已无引用的 `solar:sidebar-minimalistic-bold-duotone`。

涉及文件：`_data/icons.yml`、`layout/_partial/menubtn.ejs`、`docs/knowledge/VERIFICATION.md`。

## 3. 影响范围

- 对外行为：移动端悬浮左右栏按钮保持原 stroke 图标与 `#sep` 位移动画。
- 兼容性：`toc.ejs` 与其余引用不受影响。

## 4. 验证方式

- 主题仓库 `npm run check`。
- 主工程 `npm run g`，产物抽查：页面 HTML 中悬浮按钮区域渲染 outline 图标路径，TOC 按钮仍为 bold-duotone 路径。
