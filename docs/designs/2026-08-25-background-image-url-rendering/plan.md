---
title: 背景图 URL 渲染修复执行计划
date: 2026-08-25
---

# 执行计划

## 实施步骤

1. [x] 在 `test/appearance-final-convergence.test.js` 增加真实 Stylus 编译回归测试并确认当前实现失败。
2. [x] 将 sidebar/page 背景图输出改为 Stylus 原生 `url($image)`，运行目标测试确认通过。
3. [x] 登记知识库偏差，执行主题检查、主工程构建与生成产物验收。

## 风险与回退

- 风险集中在 Stylus 对特殊 URL 字符的序列化；回归测试使用带查询参数的独立字面量验证有效引号。
- 若原生 `url()` 在构建环境输出异常，回退为不额外包引号的 Stylus `s('url(%s)', $image)`，公开配置保持不变。
