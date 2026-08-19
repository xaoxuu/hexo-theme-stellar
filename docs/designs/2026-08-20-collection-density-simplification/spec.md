---
title: Collection Density 简化
date: 2026-08-20
status: 已实施
---

# Collection Density 简化方案

## 1. 问题与目标

- collection 同时维护 auto、compact、regular 三档，regular 会把 gap 放大到 8px；用户 linklist 又被固定为 compact，density 与内容角色不匹配。
- 成功标准：只保留 auto/compact；系统自动生成的次要列表使用 compact，其它集合默认 auto，不再存在 8px collection gap。

## 2. 技术方案

- 复用现有 `density` 接口、surface 几何变量和 menubar 专属间距覆盖，不新增配置、令牌、mixin 或 helper。
- collection 仅接受 `compact`，其它值统一输出 `auto`；删除 regular 样式。
- recent、topic/wiki related、文档树和标签树使用 compact；menubar、用户 linklist、预览 grid/summary 使用 auto。

## 3. 影响范围

- 旧的 `density: regular` 静默回退 auto，不产生模板错误；主题没有面向站点用户的 density 配置。
- menubar 的专属 2px gap 和 grid 激活态隐藏圆点规则保持不变。
- 同步组件知识库、核查记录与主工程 Stellar Wiki。

## 4. 验证方式

- 静态检查调用点与构建产物中不存在 regular，目标组件输出正确的 data-density。
- 运行知识库核查和主工程全量构建；浏览器检查首页、About、Wiki、Notebook 与开发预览。
