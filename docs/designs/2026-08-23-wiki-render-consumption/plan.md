---
title: Stellar v2 Wiki 完整渲染消费链执行计划
date: 2026-08-23
---

# 执行计划

1. [x] 独立推送 Footer 修正并创建主题 issue #713。
2. [x] 为 Wiki profile 增加必需 render Schema、纯模型构建器与 Reference 元数据。
3. [x] 将 Wiki 详情页根布局、Hero、侧栏、导航、正文辅助区域和 SEO 切到 ViewModel。
4. [x] 将 Wiki 索引的列表、筛选、置顶与 tabs 切到生成器显式投影。
5. [x] 补充模型、模板与真实生成页面回归测试。
6. [x] 同步知识库和主工程蓝图，完成检查、双轨 review 与 issue 自动闭环。

## 风险与回退

- 输出等价风险：用主站 Wiki 首页、内页和标签页的生成产物锁定 DOM、URL 与 SEO。
- 构建时序风险：索引投影只在 Wiki 树和页面 ViewModel 全部完成后发布；缺失时来源化失败。
- 迁移隔离风险：只按 `collection.profile === 'wiki'` 进入新链，Topic 与 Notebook 保持 legacy 分支。
- 回退：移除 Wiki `render` 和对应详情/索引分支即可回到 M1 挂载但未消费状态，不需要内容迁移。
