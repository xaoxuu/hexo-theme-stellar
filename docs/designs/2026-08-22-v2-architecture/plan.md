---
title: Stellar v2 工程架构实施计划
date: 2026-08-22
---

# 执行计划

工程里程碑不等同于版本阶段；只有下列 Pre-alpha M1–M5 全部完成并通过端到端门禁，才能建立 `2.0.0-alpha.1`。

## Pre-alpha M1：模型与 Reference 接缝（已完成）

1. [x] 用 post profile 贯通 Schema、CollectionModel、ContentItemModel 与冻结的 PageViewModel（[#695](https://github.com/xaoxuu/hexo-theme-stellar/issues/695)）。
2. [x] 让 wiki profile 生成同构 ViewModel；依赖步骤 1（[#698](https://github.com/xaoxuu/hexo-theme-stellar/issues/698)）。
3. [x] 让 topic profile 生成同构 ViewModel；依赖步骤 1，可与步骤 2、4 并行（[#697](https://github.com/xaoxuu/hexo-theme-stellar/issues/697)）。
4. [x] 让 notebook profile 生成同构 ViewModel；依赖步骤 1，可与步骤 2、3 并行（[#696](https://github.com/xaoxuu/hexo-theme-stellar/issues/696)）。
5. [x] 从四类已交付 Schema 生成第一批公共 Reference 元数据；依赖步骤 1–4（[#699](https://github.com/xaoxuu/hexo-theme-stellar/issues/699)）。

## Pre-alpha M2：渲染内核

6. [x] 普通 Post 用 ViewModel 接入根布局、侧栏、Brand、菜单、面包屑与 SEO，并新增五类布局原语（部分交付，[#700](https://github.com/xaoxuu/hexo-theme-stellar/issues/700)）。
7. [x] 迁移普通 Post 的文章内容、标签、评论、相关推荐与列表消费链（#701）。
8. [x] 迁移 Wiki、Topic、Notebook 的布局、导航、列表与 SEO 消费链（#713–#715）；M2 已完成。

## Pre-alpha M3：分发入口

9. [x] 实现三套 Blueprint、两套 Visual Style、init 与 doctor（#716）；M3 已完成。

## Pre-alpha M4：浏览器运行时

10. [x] 实现 ESM runtime、Extension registry、request/cache 与生命周期测试（#717）；M4 已完成。

## Pre-alpha M5：Reference 与 Alpha 集成

11. [x] 用已交付 Schema/manifest 完成公开 Reference 文档生成、链接集成与 npm tarball 发布演练（#718）；M5 已完成。

## Alpha 1 门禁

- [x] 预发布包可安装到干净的 Hexo 8 / Node.js 22 工程。
- [x] 三套 Blueprint 的 init、冲突拒绝、独立构建与 doctor 检查通过（#716）。
- [x] 四类 Collection profile 通过 ViewModel 消费链渲染。
- [x] Schema、布局原语、CLI 与 Extension 生命周期测试通过。
- [x] Reference 与已交付契约一致，主题检查、主工程构建和预发布安装演练通过。
- [x] Alpha 发布说明列出仍不稳定的契约与未交付范围。

## 风险与回退

- 领域模型先作为生成期唯一规范化出口接入，再逐页替换模板，避免一次改变全部页面行为。
- post profile 只负责建立共享接缝，不绑定其它 profile 的专有导航和列表语义。
- 浏览器旧插件按功能迁移；尚未迁移的插件不得伪装成已符合新契约。
- v2 不兼容 v1，回退方式是切回主题 `main` 与文档 `v1`，不是增加运行时兼容层。
