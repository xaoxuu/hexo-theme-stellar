---
title: Wiki Hero 操作按钮 Spotlight 执行计划
date: 2026-08-20
---

# 执行计划

## 实施步骤

1. [x] 为 Wiki Hero 三类按钮输出 Spotlight-only 组合类。
2. [x] 收窄源码按钮反色规则并扩展标记测试。
3. [x] 同步主题知识库、验证记录和主仓库 Wiki。
4. [x] 完成主题检查、知识库核查与主工程构建。

## 风险与回退

- 注入层误继承反色：选择器显式排除 `.card-hover__spotlight`。
- 交互动效过重：不启用 Tilt 或上浮，只复用 Spotlight。
- 能力不可用：沿用插件现有静态降级，不影响链接。
