---
title: Stellar v2 浏览器运行时实施计划
date: 2026-08-23
---

# 执行计划

1. [x] 审计现有 scripts、plugin、comment、service、utils request/cache、恢复队列与网络 monkey patch。
2. [x] 创建并绑定 `xaoxuu/hexo-theme-stellar` 的 v2 M4 实施 issue（#717）。
3. [x] 建立 runtime manifest 的纯对象 builder、严格校验、深冻结与安全 JSON 注入。
4. [x] 实现 ESM ExtensionRegistry、asset loader、request/cache client 和旧数据服务薄适配。
5. [x] 将 search、services、comments 和 Feature partial 迁入声明式 Extension manifest，删除同步补载、注册队列与网络 monkey patch。
6. [x] 补充 runtime/模板/生成回归测试；同步知识库、`VERIFICATION.md` 和主仓库三份 v2 蓝图状态文档。
7. [x] 运行主题完整检查、知识库核查、主工程构建和关键页面产物抽查。
8. [x] 对固定基线 `13081b49` 执行 Standards / Spec 双轨 review 并修复全部 finding。
9. [x] 提交并推送 `origin/v2`，登记验证提交，评论证据、添加 `resolved` 并等待 CI 自动关闭 issue。
