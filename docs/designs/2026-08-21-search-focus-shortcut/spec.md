---
title: 搜索框键盘快捷键
date: 2026-08-21
status: 已通过
---

# 搜索框键盘快捷键方案

## 1. 问题与目标

侧边栏搜索目前只能通过指针或 Tab 聚焦。目标是为桌面布局增加固定的 `Command+K` / `Ctrl+K` 快捷键，同时不干扰窄屏布局、浏览器默认快捷键和其它编辑区域。

## 2. 技术方案

- 复用 `layout/_plugins/index.ejs` 的搜索服务公共加载入口、`utils.js()` 脚本加载器、`#search-input` DOM 接口和现有移动端左栏按钮，不新增配置、设计令牌或国际化文案。
- 新增 `source/js/search/shortcut.js`，由公共入口加载一次，本地搜索与 Algolia 共用。
- 客户端监听 `keydown`：仅接管无 `Shift` / `Alt` 的 `Meta/Ctrl+K`；输入法组合、其它可编辑区域、缺少搜索框或移动端按钮实际可见时保持原生行为。
- 窄屏状态读取 `.mobile-only.leftbar-toggle` 的计算样式，不复制 Stylus 的 `$device-mobile-max` 数值。成功接管时只聚焦搜索框，保留值、选区和搜索结果。
- 脚本在 DOM 就绪后初始化；页面采用整页导航，无 PJAX 重挂载或销毁需求。脚本缺失或初始化失败时退化为浏览器原生快捷键。

## 3. 影响范围

- 涉及搜索插件公共模板、客户端搜索脚本、客户端行为测试与本目录设计记录。
- 同步 `docs/knowledge/02-布局系统/sidebar-system.md`、`docs/knowledge/07-外部集成/search.md` 与主工程 `source/wiki/stellar/sidebar.md`。
- 不改动本地搜索或 Algolia 查询逻辑、搜索配置、样式、国际化文案和公开 JavaScript API。

## 4. 验证方式

- 客户端测试覆盖 `Command+K`、`Ctrl+K`、既有内容保留，以及窄屏、无搜索框、编辑区域、输入法组合和错误按键降级。
- 模板测试固定共享脚本仅由公共搜索入口加载一次。
- 运行 `npm run check` 与主工程 `npm run g`，抽查生成页面中的脚本引用和搜索组件结构。
