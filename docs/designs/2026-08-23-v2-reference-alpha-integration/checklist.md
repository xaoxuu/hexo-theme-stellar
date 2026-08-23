---
title: Stellar v2 Reference 与 Alpha 集成检查清单
date: 2026-08-23
issue: 718
---

# Reference 与文档

- [x] JSON 与 Markdown 消费同一 Schema/manifest，重复生成字节稳定。
- [x] 全部公开字段包含类型、默认值、作用域、消费方和最小示例。
- [x] Reference 索引、相对链接与锚点检查通过。
- [x] Alpha 安装、init、doctor、Blueprint/Style 示例通过真实执行。
- [x] Alpha 文档列出不稳定契约与 Beta 未交付范围。

# 打包与端到端

- [x] npm tarball 包含 Blueprint、Reference、Alpha 文档、Schema、模板和浏览器 runtime。
- [x] npm tarball 排除 test、ci、知识库、agent 文件与 lockfile。
- [x] 三个隔离 Hexo 8 / Node.js 22 工程从 tarball 安装并分别完成 init → doctor → generate。
- [x] post、wiki、topic、notebook 的生成页可验证 ViewModel 消费链。
- [x] Runtime Manifest 可解析且页面只输出一个 ESM runtime 入口。

# 性能与版本

- [x] 固定 v1 tag、输入、资源分类与 gzip 统计算法。
- [x] v2 首屏核心 JS gzip 相比 v1 至少下降 30%。
- [x] 全部 M5 门禁通过后建立 `2.0.0-alpha.1` 字符的候选包；不发布 npm、不创建 tag，不单独宣告 Alpha 1。

# 仓库门禁

- [x] `npm run reference:check` 通过。
- [x] 主题 `npm run check` 通过（357 项测试）。
- [x] 主题知识库核查通过（行号异常与版本不一致均为 0）。
- [x] 主工程 `npm run g` 通过（生成并压缩 262 个文件）。
- [x] Standards review 无剩余硬违规；保留两份独立 CI 门禁脚本重复 helper 的判断项，不在本切片扩大抽象范围。
- [x] Spec review 无剩余 finding。
- [x] 主题知识库、架构状态、`VERIFICATION.md` 与主仓库三份蓝图状态已同步。
- [x] 主仓库 `source/`、既有内容改动和 v2 子模块指针未暂存、未提交。
- [x] 实现与验证登记提交已推送 `origin/v2`，issue 由 `resolved` CI 自动关闭。
