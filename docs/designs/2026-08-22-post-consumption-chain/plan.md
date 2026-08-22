---
title: Stellar v2 普通 Post 内容与列表消费链执行计划
date: 2026-08-22
---

# 执行计划

1. [x] 创建 #701，锁定 #700 后续边界和现有工作区改动。
2. [x] 扩展 Post `render.article/listing` Schema、模型与构建边界适配。
3. [x] 迁移普通 Post 详情内容、Footer、关系和评论 partial。
4. [x] 迁移首页、分类、标签、归档、置顶与 Post 卡片的条目消费链。
5. [x] 补充模型、模板和生成页面回归测试。
6. [x] 同步主题知识库与主工程总蓝图，运行全部门禁并记录证据。

## 风险与回退

- 输出等价风险：用现有真实 Post、Topic 与 Wiki 页面生成结果锁定 DOM 和语义行为。
- 第三方插件风险：只在启用相关推荐时调用插件适配器，缺失时严格失败，不新增静默 fallback。
- 列表时序风险：Hexo Warehouse 不保存任意 ViewModel 字段；普通 Post 列表通过生成前登记输入重建冻结投影，缺失时携带源文件失败。Topic Post 使用显式迁移期旧分支。
- 回退：移除 `render.article/listing` 与对应 Post 分支即可回到 #700 状态，不需要内容迁移。
