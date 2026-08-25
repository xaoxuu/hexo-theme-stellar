---
title: v2 空配置与最小内容默认体验执行计划
date: 2026-08-25
---

# 执行计划

## 实施步骤

1. [x] 建立共享归属解析器并接入 Collection Pipeline 与 doctor，覆盖唯一、零、多重和显式冲突。
2. [x] 让缺失/空 `_config.stellar.yml` 使用 Schema 默认值，补齐最小 Post/Page 与内容字段降级测试。
3. [x] 增加 Blueprint 最小性门禁，精简三套配置、两套 Style 与 starter Front Matter。
4. [x] 扩展 tarball fixture，验证无 init 的默认站点和 Wiki/Topic/Notebook 推断。
5. [x] 同步知识库、Reference/总蓝图状态并完成主题、Alpha、性能和主工程构建验证。

## 风险与回退

- 推断过宽会把普通内容错误吸入 Collection，因此只有明确命名空间、tree 成员或 Topic `route.start` 才产生候选；普通内容零候选不报错。
- doctor 与 Hexo 运行时路径可能不同，因此共享解析器同时接受源路径和最终页面路径，测试保证两端得到相同候选。
- Blueprint 精简不能改变预期 Persona 结果；组合配置按最终规范化对象比较，只有确实等同默认值的叶子才允许删除。
