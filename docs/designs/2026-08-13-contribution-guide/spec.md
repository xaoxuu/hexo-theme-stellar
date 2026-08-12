---
title: 补充贡献说明文档（CONTRIBUTING.md + Wiki 贡献页）
date: 2026-08-13
status: 已实施
---

# 补充贡献说明文档 方案

## 1. 问题与目标

- 要解决的问题：公开贡献指南（xaoxuu.com/wiki/stellar/contributors/）目前只有「开发者列表 + 如何加入社区 + 提问建议」，缺少面向开发者的完整贡献流程；主题仓库也没有本地 `CONTRIBUTING.md`。
- 成功标准（可验收的行为）：
  - 主题仓库根目录存在 `CONTRIBUTING.md`，覆盖环境准备、开发流程、编码规范、测试验证、提交与 PR 规范、发版与社区渠道
  - Wiki 贡献页新增「如何贡献」小节，精简引导并链接到 GitHub 上的详细指南
  - README「反馈」区提供本地 `CONTRIBUTING.md` 入口，同时保留原 Wiki 贡献页链接

## 2. 技术方案

- 纯文档改动：新增 `CONTRIBUTING.md`，修改 `README.md` 与 docs 仓库 `source/wiki/stellar/contributors.md`
- 内容以 `AGENTS.md`（§6/§7/§9/§10）、`.github/PULL_REQUEST_TEMPLATE.md`、CI 配置、`docs/guides/release-process.md` 为事实来源整理，不发明新流程
- 按 `AGENTS.md` §7.1 在本目录建立方案文档（spec / plan / checklist）
- 涉及文件：`CONTRIBUTING.md`、`README.md`、`docs/designs/2026-08-13-contribution-guide/`、docs 仓库 `contributors.md`

## 3. 影响范围

- 对外行为 / 配置项 / 兼容性影响：无（纯文档，不涉及主题代码与行为）
- 需要同步的知识库页面：无需更新 `docs/knowledge/`，`VERIFICATION.md` 不登记（非行为变更）
- 注意：`source/wiki/stellar` 是 docs 仓库（hexo-theme-stellar-docs）的 submodule 检出，其改动留在该子模块工作区，不进主工程提交

## 4. 验证方式

- 主题仓库 `npm run check`（lint + 单测 + 知识库核查）通过
- 主工程 `npx hexo generate`（或 `npm run g`）确认 Wiki 贡献页新增内容渲染无报错
- 链接可达性检查：GitHub `CONTRIBUTING.md` URL、docs 仓库 URL、README 相对链接
