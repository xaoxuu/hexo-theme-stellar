---
title: 修复 Babel 转译将 sidebar 全局改名导致侧边栏失效
date: 2026-08-16
status: 已实施
---

# 修复 Babel 转译将 sidebar 全局改名导致侧边栏失效

## 1. 问题与目标

- 生产构建（`npm run g`）中 Babel preset-env 的 function-name 插件检测到 `init.sidebar` 方法名与顶层 `const sidebar` 同名、且方法体引用了该变量，将顶层绑定改名为 `_sidebar`，导致模板内联 `onclick="sidebar.leftbar()"` 等调用报 `sidebar is not defined`，侧边栏无法开合；本地 `npm run s` 不经过 Babel 转译，表现正常。
- 成功标准：`npm run g` 产物 `public/js/main.js` 中全局名为 `sidebar`（含 `sidebar={leftbar:`），不存在 `_sidebar`；线上侧边栏按钮、遮罩、TOC 交互恢复正常，控制台无 `sidebar is not defined`。

## 2. 技术方案

- 消除同名冲突：`init.sidebar` 方法体内引用顶层 `sidebar` 的 `sidebar.dismiss()` 改为显式 `window.sidebar.dismiss()`，function-name 插件不再需要将顶层绑定改名。
- 涉及文件：`source/js/main.js`（L356），为文件内唯一引用顶层 `sidebar` 的位置。

## 3. 影响范围

- 对外行为：无变化（`window.sidebar.dismiss()` 与 `sidebar.dismiss()` 行为等价，生产构建后 `sidebar` 全局恢复为预期名称）。
- 配置项 / 兼容性：无影响。
- 需同步的知识库页面与文档：无（纯内部实现等价改写）。

## 4. 验证方式

- 主工程执行 `npm run g`，检查 `public/js/main.js` 含 `sidebar={leftbar:` 且无 `_sidebar`；首页 HTML 内联 onclick 仍为 `sidebar.leftbar()` / `sidebar.rightbar()` / `sidebar.dismiss()`。
- 部署后访问 https://xaoxuu.com/ 验证侧边栏开合与控制台无报错。
