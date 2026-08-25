---
title: 功能与文档原子交付检查清单
date: 2026-08-25
---

# 检查清单 / 验证记录

## 文档同步核验

- [x] 最终 diff 仅改变协作流程、文档、测试入口和内部检查，不改变主题运行时或公开 API。
- [x] 当前规范、双份 Skill、issue 流程、发版指南、设计模板与知识库记录使用同一交付语义。
- [x] `VERIFICATION.md` 已在提交前记录本次流程修正，不依赖尚未产生的 SHA。
- [x] 主工程公开 Wiki 为 N/A：本次不改变用户功能、配置或主题行为。

## 验证

- [x] Node.js 22.23.2 `npm run check`：lint、424 项测试、规范引用、Schema、性能与知识库检查全部通过；性能降幅 50.5052%，门槛为 30%。
- [x] Node.js 22.23.2 `npm test`：本次流程调整后 424 项测试、依赖声明、Contribution 与规范引用检查全部通过。
- [x] `python3 docs/knowledge/tools/verify.py`：行号异常与版本不一致均为 0；34 个未解析文件和 13 个配置键异常为既有非阻断报告。
- [x] Codex / Claude Skill 镜像逐字一致。
- [ ] 官方 `quick_validate.py`：运行环境缺少其未自带的 PyYAML，脚本在读取 Skill 前退出。
- [x] 使用项目既有 `js-yaml` 执行等价 frontmatter、允许字段、命名、描述与 TODO 校验，相关 Skill 均通过。
- [x] 当前规范与执行入口无活动的 SHA 登记引用。
- [x] `git diff --check`。
- [x] 主工程 `npm run g` 为 N/A：未修改主题运行时代码、模板或构建期 `scripts/`。

## 交付准备

- [x] 功能、测试、文档、方案状态与验证记录已纳入同一工作区改动。
- [x] 用户已明确要求提交；本次只创建主题仓库本地提交，不推送或处理 issue。
