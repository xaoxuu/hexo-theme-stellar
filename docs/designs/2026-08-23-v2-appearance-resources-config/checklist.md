---
title: Stellar v2 外观与资源兜底配置检查清单
date: 2026-08-23
---

# 检查清单 / 验证记录

## 契约与实现

- [x] `appearance` 与 `resources.fallbacks` 全部目标节点为 delivered。
- [x] 主题默认与主工程覆盖只使用最终 snake_case 路径。
- [x] 运行时得到深冻结 camelCase 配置且保留当前默认值。
- [x] EJS、Node.js、Model 元数据与 Stylus 不再读取 `style/default`。
- [x] `style.prefix` 已删除，`style.loading.*` 已由语言文件承担。
- [x] 配置 Reference 只新增本切片 delivered 节点且无 planned 泄漏。

## 验证与闭环

- [x] `npm run check` 与双 Reference 检查通过（282 项测试）。
- [x] 知识库硬核查通过。
- [x] 主工程 `npm run g` 与关键产物抽查通过（254 个生成文件）。
- [x] Standards / Spec review 无剩余 finding。
- [x] 主题提交已推送 `origin/v2`，#710 已评论证据并以 `resolved` 闭环。
- [x] 主工程保持未提交且未提交子模块指针。

## N/A

- [x] 依赖、URL、公开 Wiki 与 SEO 变化为 N/A。
- [x] 本切片是保行为配置迁移，不重做视觉设计或客户端算法。
