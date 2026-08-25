---
title: Stellar v2 Theme Schema 单源与 Brand 配置边界执行计划
date: 2026-08-25
---

# 执行计划

1. [x] 将 Theme 类型和默认值迁入 `CONFIG_SCHEMA`，删除 Brand 三字段的 derived 默认。
2. [x] 删除主题解析器的 Hexo site config fallback，并更新行为测试。
3. [x] 建立默认 YAML 与 Reference/审计统一生成、漂移检查命令。
4. [x] 显式迁移主站 Brand，更新主题知识库、公开 Wiki 和 v2 状态。
5. [x] 完成主题、候选包、知识库与主工程构建验证。
6. [x] 删除路径复述注释，为活动叶子补齐语义描述和 Schema 约束提示，并将 YAML 示例改为显式选择。

## 风险与回退

- 空配置普通页面将不再自动出现 Brand；以明确的 `null` 默认和公开文档说明固定该行为。
- 主站在主题配置中复制当前 avatar/title，避免行为切换造成视觉回归。
