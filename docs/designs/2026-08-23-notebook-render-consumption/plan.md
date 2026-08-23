---
title: Stellar v2 Notebook 完整渲染消费链执行计划
date: 2026-08-23
---

# 执行计划

1. [x] 创建并绑定主题实施 issue #715。
2. [x] 为 Notebook profile 增加必需 render Schema、两阶段模型构建器与 Reference 元数据。
3. [x] 将 Note 详情页根布局、Brand、侧栏、标签树、导航、正文辅助区域和 SEO 切到 ViewModel。
4. [x] 将 Notebook 总索引、单集合首页与标签分页切到显式冻结投影。
5. [x] 补充模型、模板与生成器投影回归测试，并以主工程全站生成验证其它 profile 隔离。
6. [x] 同步知识库和主工程蓝图，完成检查与双轨 review，并准备 issue 自动闭环证据。

## 风险与回退

- 输出等价风险：以 Notebook 总索引、一个 Notebook 首页、标签筛选页和普通 Note 详情生成产物锁定 DOM、URL 与 SEO。
- 构建时序风险：Front Matter 输入先登记，Notebook 树完成后才完成 collection、tag tree、listing 和详情 render。
- 分页风险：显式卡片数组必须保持 Hexo `order_by` 排序、priority 二次置顶和空标签页行为。
- 回退：移除 Notebook `render`、显式索引投影和对应模板分支即可回到 M1 挂载但未消费状态，不需要内容迁移。
