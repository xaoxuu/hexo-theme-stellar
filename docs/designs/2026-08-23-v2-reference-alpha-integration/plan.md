---
title: Stellar v2 Reference 与 Alpha 集成实施计划
date: 2026-08-23
issue: 718
---

# 执行计划

1. [x] 绑定主题 v2 issue #718，冻结 M5、Alpha 与 Beta 的范围边界。
2. [x] 扩展 Reference 生成器，稳定生成 JSON、公开 Markdown、索引和性能记录，并增加字段完整性/链接/漂移测试。
3. [x] 增加 `ALPHA.md` 与 README 入口，真实验证 init/doctor 示例并记录不稳定契约和未交付范围。
4. [x] 建立 npm tarball 安装门禁，在三个隔离 Hexo 8 工程运行 init → doctor → generate，覆盖四类 profile 与 Runtime Manifest。
5. [x] 固化 v1/v2 首屏核心 JS gzip 口径并达到 30% 阈值；建立 `2.0.0-alpha.1` 字符的候选包，不代表 Alpha 1 最终决策。
6. [ ] 同步主题知识库、架构状态、`VERIFICATION.md` 和主仓库三份 v2 蓝图状态文档。
7. [ ] 运行主题、主工程、Reference、打包、端到端与双轨 review 门禁，提交推送并以 `resolved` 闭环 #718。

# 风险与回退

- 公开 Markdown 必须由机器元数据生成；手写内容只限导航和 Alpha 叙事，避免重复字段事实。
- npm 安装门禁如果依赖网络，只允许显式集成命令使用；仓库常规单测保持离线、确定且快速。
- 性能统计固定输入、基线 tag、资源分类与 gzip 算法，不使用手工挑选资源或开发源文件大小替代生成产物。
- 任一 Alpha 门禁失败时可以完成已独立验收的 M5 能力，但不得改版本、打 tag、发布或勾选 Alpha 1。
