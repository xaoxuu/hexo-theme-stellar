---
title: Stellar v2 实施 issue 自动交付闭环
date: 2026-08-22
status: 已实施
---

# Stellar v2 实施 issue 自动交付闭环

## 问题

主题仓库的普通协作门禁要求用户逐次授权提交和推送。Stellar v2 以 GitHub Issues 驱动连续纵向切片，需要一个限定在 `v2` 集成分支的可检查交付终点。

## 方案

- `$stellar-v2-program` 接管且目标为本仓库 `v2` 分支的实施 issue 获得持续交付授权。
- `docs/agents/issue-tracker.md` 作为闭环步骤的唯一事实来源。
- 全部门禁通过后，只提交当前 issue 范围，推送 `origin/v2`，评论提交与验证证据，再添加 `resolved` 标签。
- 沿用 label-commenter CI 关闭 issue；普通主题任务继续使用原有授权门禁。

## 影响范围

- Agent 协作规范、主题开发 Skill 及其 Claude 镜像、issue tracker 操作约定。
- 不改变主题代码、运行时行为、构建产物、公开配置或发版流程。

## 验收标准

- 分支、上游、工作区隔离与验证门禁均有明确完成条件。
- v2 issue 的提交到达 `origin/v2` 后才进入评论和 `resolved` 阶段。
- 主仓库变更与无关工作区修改不会进入自动闭环。
- label-commenter 仍是关闭 issue 的唯一执行方。
