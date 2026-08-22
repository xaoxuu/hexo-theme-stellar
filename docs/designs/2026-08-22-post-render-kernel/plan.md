---
title: Stellar v2 普通 Post 渲染内核执行计划
date: 2026-08-22
---

# 执行计划

1. [x] 创建 #700，核对 M1 模型、现有 EJS 消费点与工作区边界。
2. [x] 为 Post profile 增加必需 render Schema、构建逻辑与 Reference 元数据。
3. [x] 建立 Shell、Region、Section、Item、Navigation 五类布局原语。
4. [x] 将普通 Post 的根布局、侧栏导航、Brand、面包屑、head 与 JSON-LD 切到 ViewModel。
5. [x] 增加模型、原语、缺失模型与真实生成页面回归测试。
6. [x] 同步主题知识库和主工程总蓝图，运行全部门禁并记录证据。

## 风险与回退

- SEO 等价风险：以构建前后的普通 Post 语义输出和现有回退测试锁定，不复制另一套规则。
- 迁移边界风险：只按 `collection.profile === "post"` 进入新链路；Topic Post 不因 `layout: post` 被误接管。
- 原语过度泛化风险：slot/kind 使用封闭集合，不允许用户数据选择 partial。
- 回退：移除 Post `render` 与原语分支即可回到 M1 挂载但 EJS 未消费的状态，不需要内容迁移。
