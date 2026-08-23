---
title: Stellar v2 Extension 与服务配置检查清单
date: 2026-08-23
---

# 检查清单 / 验证记录

## 契约与实现

- [x] `extensions.search/comments/tags/features/services/cache` 目标节点为 delivered。
- [x] 主题默认与主工程覆盖只使用最终 snake_case 路径。
- [x] 第三方 provider 参数袋保留上游字段，Stellar 父级容器严格封闭。
- [x] 官方 JS/CSS/inject 与数据服务模块已内部化。
- [x] EJS、Node.js、tag plugin、Stylus 与客户端配置注入不再读取旧根。
- [x] 配置 Reference 只新增本切片 delivered 节点且无 planned 泄漏。

## 验证与闭环

- [x] 主题 `npm run check` 与双 Reference 检查通过（287 项测试）。
- [x] 知识库硬核查通过。
- [x] 主工程 `npm run g` 与关键产物抽查通过（254 个文件；日志无 `ERROR` 或 `Render HTML failed`）。
- [x] Standards / Spec review 无剩余 finding。
- [x] 主题提交已推送 `origin/v2`，#711 已评论证据并以 `resolved` 闭环。
- [x] 主工程保持未提交且未提交子模块指针。

## N/A

- [x] 依赖、URL、公开 Wiki、SEO 与视觉布局变化为 N/A。
- [x] M4 Extension 生命周期与 request/cache 算法重写不属于本切片。
