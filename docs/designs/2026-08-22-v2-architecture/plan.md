---
title: Stellar v2 工程架构实施计划
date: 2026-08-22
---

# 执行计划

## Alpha 1：模型与 Reference 接缝

1. [x] 用 post profile 贯通 Schema、CollectionModel、ContentItemModel 与冻结的 PageViewModel（[#695](https://github.com/xaoxuu/hexo-theme-stellar/issues/695)）。
2. [ ] 让 wiki profile 生成同构 ViewModel；依赖步骤 1（[#698](https://github.com/xaoxuu/hexo-theme-stellar/issues/698)）。
3. [ ] 让 topic profile 生成同构 ViewModel；依赖步骤 1，可与步骤 2、4 并行（[#697](https://github.com/xaoxuu/hexo-theme-stellar/issues/697)）。
4. [ ] 让 notebook profile 生成同构 ViewModel；依赖步骤 1，可与步骤 2、3 并行（[#696](https://github.com/xaoxuu/hexo-theme-stellar/issues/696)）。
5. [ ] 从四类已交付 Schema 生成第一批公共 Reference 元数据；依赖步骤 1–4（[#699](https://github.com/xaoxuu/hexo-theme-stellar/issues/699)）。

## 后续阶段

6. [ ] 用 ViewModel 接入页面根布局，并新增五类布局原语。
7. [ ] 实现三套 Blueprint、两套 Visual Style、init 与 doctor。
8. [ ] 实现 ESM runtime、Extension registry、request/cache 与生命周期测试。
9. [ ] 完成公共 Reference 生成、知识库同步与全量构建演练。

## 风险与回退

- 领域模型先作为生成期唯一规范化出口接入，再逐页替换模板，避免一次改变全部页面行为。
- post profile 只负责建立共享接缝，不绑定其它 profile 的专有导航和列表语义。
- 浏览器旧插件按功能迁移；尚未迁移的插件不得伪装成已符合新契约。
- v2 不兼容 v1，回退方式是切回主题 `main` 与文档 `v1`，不是增加运行时兼容层。
