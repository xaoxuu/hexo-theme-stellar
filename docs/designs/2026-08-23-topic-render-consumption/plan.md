---
title: Stellar v2 Topic 完整渲染消费链执行计划
date: 2026-08-23
---

# 执行计划

1. [x] 创建并绑定主题实施 issue。
2. [x] 为 Topic profile 增加必需 render Schema、两阶段模型构建器与 Reference 元数据。
3. [x] 将 Topic 详情页根布局、侧栏、导航、正文辅助区域和 SEO 切到 ViewModel。
4. [x] 将博客列表卡片、置顶轮播和 Topic 索引切到显式 listing 投影。
5. [x] 补充模型、模板与真实生成页面回归测试。
6. [x] 同步知识库和主工程蓝图，完成检查与双轨 review，并准备 issue 自动闭环证据。

## 风险与回退

- 输出等价风险：以 Topic 索引、一个 Topic 首页成员和普通 Topic 成员的生成产物锁定 DOM、URL 与 SEO。
- 构建时序风险：基础输入在生成前登记，最终 render 在 Markdown 渲染后冻结；索引投影不依赖模板渲染时的原始 tree。
- 导航语义风险：Topic series 仅迁移侧栏 related widget，全站 `prev/next` 继续用于正文上下篇。
- 回退：移除 Topic `render`、显式索引投影和对应模板分支即可回到 M1 挂载但未消费状态，不需要内容迁移。
