---
title: Stellar v2 Article 与 Notebook 内容默认配置检查清单
date: 2026-08-23
---

# 检查清单 / 验证记录

## 契约与实现

- [x] Article / Notebook 全部主题字段具有唯一最终路径和已交付状态。
- [x] Schema 默认与当前页面行为一致，且非法类型、值、旧字段可定位报错。
- [x] CollectionModel、PageViewModel、helper 与模板不再读取旧根。
- [x] Collection / Front Matter 覆盖保持现有行为和后续迁移边界。
- [x] 配置 Reference 只投影已交付节点且无漂移。

## 验证与闭环

- [x] `npm run check` 通过（279 项测试）。
- [x] 知识库硬核查通过。
- [x] 主工程 `npm run g` 生成并压缩 254 个文件，Article、Notebook 与 CSS 比例产物抽查通过。
- [x] Standards / Spec review 无剩余 finding。
- [x] 主题提交 `ae09d1a` 与验证登记 `b1f8960` 已推送 `origin/v2`，#708 已评论证据并以 `resolved` 闭环。
- [x] 主工程保持未提交且未提交子模块指针。

## N/A

- [x] CSS 样式行为、浏览器 JavaScript、语言文件和公开 Wiki 变更为 N/A；仅 Stylus 配置路径随契约迁移。
- [x] URL、SEO 输出和依赖变化为 N/A。
