---
title: Stellar v2 Layout Profile 配置消费链执行计划
date: 2026-08-22
---

# 执行计划

## 实施步骤

1. [x] 补充 Layout 目标树、严格运行时 Schema 与契约测试。
2. [x] 迁移主题默认配置和主工程站点覆盖。
3. [x] 迁移生成器、构建逻辑、ViewModel 与 EJS 消费链。
4. [x] 更新配置目录、双 Reference、知识库与 #707 状态证据。
5. [x] 执行主题检查、主工程构建和页面产物抽查。
6. [x] 运行 Standards / Spec 双轨 review，修复全部 finding。
7. [ ] 提交并推送主题 `v2`，评论验证证据并添加 `resolved`。

## 依赖关系

- Schema 与默认树先于生成器和模板迁移。
- 生成器、模型和模板必须在同一提交中切换，避免新旧路径混用。
- Reference、知识库和蓝图状态以最终代码与验证结果为依据。

## 风险与回退

- 通过 Git 提交整体回退，不引入双读或字段别名。
- 若 Collection/Front Matter 迁移期覆盖与新 Profile 默认无法隔离，#707 保持打开并记录阻塞，不扩大到下一配置切片。
