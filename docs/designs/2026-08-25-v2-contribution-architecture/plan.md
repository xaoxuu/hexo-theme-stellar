---
title: Stellar v2 贡献架构与一致性 CI 执行计划
date: 2026-08-25
issue: 725
---

# 执行计划

## 实施步骤

1. [x] 盘点 Runtime Manifest、assets、Schema、i18n、标签、组件、测试和文档中的登记事实。
2. [ ] 建立贡献描述契约与内置注册表，用单测固定字段、顺序和重复拒绝。
3. [ ] 将 Runtime Manifest 改为注册表投影，拆出 Card Hover adapter 并保持全部现有行为。
4. [ ] 实现文件、assets、Schema/Reference、i18n、默认值所有者与行为测试一致性检查。
5. [ ] 增加六类负向 fixture，将 contribution gate 接入 npm 和 GitHub Actions。
6. [ ] 编写七类贡献维护面、Card Hover 演练，同步知识库与验证台账。
7. [ ] 执行主题检查、Alpha tarball、主工程生成与 Standards / Spec 复审。
8. [ ] 只更新主工程三份总蓝图的 M8 状态；主题提交推送到 `origin/v2` 并闭环 #725。

## 风险与回退

- 注册表投影会改变 Runtime Manifest 建立方式，但不改变输出格式；以现有 Manifest 顺序和完整 fixture 作为回归基线。
- 描述契约不吸收 ESM mount 实现、Schema 值或语言真值，避免以“统一”为名破坏分层。
- 既有 `feature.mjs` 暂时保留其它历史 Feature 的兼容 dispatch；Card Hover 证明新增简单 Feature 可使用独立入口，不在 M8 中顺手拆分全部模块。
- 主工程存在大量既有未提交迁移改动；仅修改三份蓝图状态，不暂存或提交主工程。
