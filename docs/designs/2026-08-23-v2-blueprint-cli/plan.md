---
title: Stellar v2 Blueprint 与 CLI 分发入口实施计划
date: 2026-08-23
---

# 执行计划

1. [x] 审计现有命令、配置 Schema、Hexo CLI 生命周期、npm 分发边界与 M3 蓝图。
2. [x] 创建并绑定 `xaoxuu/hexo-theme-stellar` 的 v2 M3 实施 issue（#716）。
3. [x] 建立 Blueprint / Visual Style manifest Schema、目录资产与安全文件计划。
4. [x] 实现 `stellar init` 的交互/非交互、dry-run、冲突拒绝和一次性写入。
5. [x] 实现 `stellar doctor` 的环境、主题、配置、Collection 和 Front Matter 只读检查，以及 text/json 输出。
6. [x] 补充模型、命令与三套生成站点回归；同步配置 Reference、知识库和 `VERIFICATION.md`。
7. [x] 同步主仓库三份 v2 蓝图状态文档，不提交主仓库或更新子模块指针。
8. [x] 运行主题完整检查、知识库核查、三套临时站点构建和主工程构建（320 项测试、3 套独立构建、主工程 254 个生成文件）。
9. [x] 对固定基线 `3a0295c` 执行 Standards / Spec 双轨 review 并修复全部 finding；两轴最终均为 0 finding。
10. [ ] 提交并推送 `origin/v2`，登记验证提交，评论证据、添加 `resolved` 并等待 CI 自动关闭 issue。
