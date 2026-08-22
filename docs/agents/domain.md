# 领域文档

工程 skills 探索主题代码时按以下规则消费领域文档。本文件补充 `AGENTS.md` 的主题知识库规则，不取代 `docs/knowledge/`。

## 探索前读取

- 根目录 `CONTEXT.md`。
- 若存在 `CONTEXT-MAP.md`，读取与当前任务相关的 `CONTEXT.md`。
- `docs/adr/` 中与当前工作区域相关的 ADR。
- 按 `AGENTS.md` 读取 `docs/knowledge/` 对应主题领域。

这些文件不存在时静默继续。领域术语或架构决策得到确认后，再由 domain-modeling 工作流按需创建。

## 文件布局

本仓库采用 single-context：

```text
/
├── CONTEXT.md
├── docs/adr/
├── docs/knowledge/
├── scripts/
├── layout/
└── source/
```

## 使用 glossary 词汇

issue 标题、架构方案和测试名称涉及领域概念时，使用 `CONTEXT.md` 已定义的术语。

如果所需概念尚未定义，应先确认它是否属于项目语言；若确实缺失，记录给 domain-modeling 工作流。

## 标记 ADR 冲突

输出与已有 ADR 冲突时明确指出，不静默覆盖。
