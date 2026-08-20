---
title: Dropdown 与侧栏列表样式统一执行计划
date: 2026-08-20
---

# 执行计划

## 实施步骤

1. [x] 调整 Footer trigger 状态与图标尺寸覆盖，使其完全沿用普通 social 按钮。
2. [x] 将两种 dropdown 菜单输出切换为 glass collection list，并允许省略子项图标。
3. [x] 将正文标签箭头移到标题右侧并更新单测。
4. [x] 同步主题知识库、验证记录和主工程 Wiki。
5. [x] 完成主题 lint、单测、知识库核查与主工程全量构建；完整 `npm run check` 的既有发版登记阻塞见检查清单。
6. [x] 修正通用 dropdown 图标 flex basis 导致的 Footer trigger 宽度回归，并复测实际盒模型。
7. [x] 为 Footer dropdown 主图标增加未激活半透明、激活恢复不透明的状态样式并验证。
8. [x] 在 dropdown collection 局部统一带图标与无图标条目的最小行高，并验证无图标项不产生 leading 占位。

## 风险与回退

- 浮层会把菜单移到 `body`，因此 surface 必须声明在菜单自身；否则会丢失 glass 交互令牌。
- 保留 `.dropdown-item` 兼容类与原有链接属性，回退时可仅撤销 collection 组合类和可选图标解析，不影响定位脚本。
