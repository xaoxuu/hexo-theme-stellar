---
title: Matt Pocock engineering skills 仓库配置
date: 2026-08-22
status: 已完成
---

# Agent skills 仓库配置方案

## 1. 问题

主题仓库尚未声明 Matt engineering skills 使用的 issue tracker 与领域文档消费规则，`to-tickets` 无法确定主题工单的发布位置，也缺少仓库级上下文指针。

## 2. 方案

- 以 `xaoxuu/hexo-theme-stellar` GitHub Issues 作为主题仓库的 tracker。
- 在 `AGENTS.md` 放置精简上下文指针，具体操作下沉至 `docs/agents/`。
- 采用 single-context 领域文档布局，并继续遵守主题知识库规则。
- `CLAUDE.md` 保持 `AGENTS.md` 的兼容镜像入口。
- 未安装 `triage` 时不配置标签词表，`to-tickets` 不自动附加 `ready-for-agent`。
- issue 完成后添加 `resolved` 标签，由现有 CI 关闭，不由 agent 手动关闭。

## 3. 影响范围

本次只修改 Agent 协作文档，不改变主题代码、构建产物、用户配置或运行时行为。

## 4. 验收标准

- `AGENTS.md` 能按触发条件指向 tracker 与领域文档规则。
- Engineering skills 能识别主题仓库的 GitHub Issues。
- `CLAUDE.md` 保持不变。
- 原有 v2 architecture 方案不被修改。
