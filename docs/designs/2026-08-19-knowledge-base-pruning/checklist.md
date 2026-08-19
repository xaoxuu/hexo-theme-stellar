---
title: AI 知识库设计规范与精简检查清单
date: 2026-08-19
---

# 检查清单 / 验证记录

## 文档同步

- [x] `docs/knowledge/README.md` 已补充维护规范
- [x] `AGENTS.md` 已补充知识库精简规则
- [x] 设计令牌页已明确公共数值的权威位置
- [x] 样式总览页已改为架构和决策说明
- [x] 自定义覆盖页已聚焦公开覆盖入口
- [x] 其余领域页面完成首轮分类登记，后续按审计清单增量处理

## 验证

- [x] `python3 docs/knowledge/tools/verify.py` 阻断项通过（既有未解析路径/配置键为非阻断告警）
- [x] 本次修改页面的本地链接有效
- [x] 未修改主题代码、配置和对外行为
- [x] `git diff --check` 通过
- [x] `npm run lint`、`npm test` 和 AI 规范引用检查通过
- [ ] `npm run check` 的 release 登记检查通过（已有 8 个历史提交未登记）
