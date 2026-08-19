---
title: 侧边栏集合组件重构执行计划
date: 2026-08-19
---

# 执行计划

1. [x] 新增 surface 语义变量、widget frame、collection 与 collection item。
2. [x] 迁移 menu、recent、related、tree、tagtree 与 linklist。
3. [x] 为 TOC 与搜索结果接入 collection surface/state 适配。
4. [x] 清理 linklist/menubar 配置和旧侧栏专用选择器。
5. [x] 新增开发预览 layout 与主工程草稿，覆盖四种 surface。
6. [x] 同步主题知识库、主工程 Wiki 与验证登记。
7. [x] 执行 lint、全量构建、知识库核查和页面回归。
8. [x] 将本次重构的普通间距收敛到 `2 / 4 / 8 / 12 / 16 / 24 / 32px`，优先复用 `--gap-base` / `--gap-page`。

## 风险与回退

- EJS 公共 partial 参数遗漏可能产生空 widget：frame 对空 body 直接返回空字符串，构建覆盖所有默认页面类型。
- Grid 在极窄侧栏溢出：列宽使用 `min(100%, ...)` 并以最大列数约束，预览覆盖 240px 容器。
- TOC/search 结构由外部 helper/插件生成：仅增加 adapter 类和 CSS 变量，不改运行时依赖的 ID、类名与层级。
