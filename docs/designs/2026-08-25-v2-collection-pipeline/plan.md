---
title: Stellar v2 Collection Pipeline 与 Notebook 复核执行计划
date: 2026-08-25
issue: 723
---

# 执行计划

## 实施步骤

1. [ ] 冻结四类行为矩阵与现有 fixture 输出，补 Pipeline/注册表/共享原语失败测试。
2. [ ] 建立 `collection-pipeline` 唯一入口、profile 注册表和一次发现/分组上下文。
3. [ ] 将 Post、Wiki、Topic、Notebook 编排迁入 adapter，统一 two-stage 与索引投影。
4. [ ] 将页面模型登记收敛为 profile 通用存储，保持 helper/filter 兼容入口。
5. [ ] 实现 `stellar new note` 文件计划、CLI 编排与端到端测试，删除旧 `new-note` 命令。
6. [ ] 同步内容系统知识库、Reference/漂移检查与 `VERIFICATION.md`。
7. [ ] 执行主题检查、Alpha tarball、主工程生成、产物抽查和 Standards / Spec 复审。
8. [ ] 更新主工程三份总蓝图状态。

## 风险与回退

- 最大风险是 Hexo `after_post_render` 与 `before_generate` 的时序差异；保留 input/base 登记与最终正文完成阶段，不提前冻结 Post/Topic 正文结果。
- Wiki 和 Notebook 需要树完成后才能最终建模；Pipeline 明确保留 two-stage barrier，不把导航差异压入共享模型。
- 主工程存在大量既有未提交内容迁移；本切片只修改主题、主题知识库与主工程三份蓝图状态，不覆盖或暂存其它文件。
- 若单一提交无法与已有主题改动隔离，保持 #723 打开并登记阻塞；不得夹带无关文件。
