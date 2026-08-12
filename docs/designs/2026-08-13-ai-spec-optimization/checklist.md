---
title: AI 规范优化检查清单
date: 2026-08-13
---

# 检查清单 / 验证记录

## 验证

- [x] stellar `node ci/check-skill-sync.js --check` 通过（canonical 与 Claude 镜像一致）
- [x] stellar `npm run check` 通过（lint 0 错误、9 单测通过、知识库硬事实门禁通过：行号异常 0、版本不一致 0）
- [x] 行数目标：stellar `AGENTS.md` 207、主工程 `AGENTS.md` 198；两份 `CLAUDE.md` 各 7 行
- [x] 主工程 `npm run g` 全量构建（不适用：纯文档变更，未涉及 `scripts/`）
- [x] 页面类型覆盖（不适用：无页面行为变更）
- [x] `rg "§[0-9]"` 审计：全部引用指向存在的章节
- [x] `rg "7890|http.proxy|socks5"` 代理残留为 0（知识库 `api_host` 功能描述除外）
- [x] 关键短语单一来源抽查：`npm run g` / `npm run check` 仅出现在 AGENTS.md 门禁与 skill 执行清单（逐字一致措辞）；`resolved` 与版本号规则仅出现在 stellar `AGENTS.md`

## 文档同步

- [x] `docs/designs/2026-08-13-ai-spec-optimization/` 方案文档已归档（本目录）
- [x] `docs/knowledge/` 正文更新（不适用：架构权威为既有 `overview.md`，未修改主题行为）
- [x] `docs/knowledge/VERIFICATION.md` 登记（不适用：未发现硬事实偏差）
- [x] `languages/` 文案（不适用）
