# 执行计划：修正并重构 AI 工程规范

## 改动文件清单

1. `AGENTS.md` — 合并 CLAUDE.md 实质内容并修正（唯一权威完整规范）
2. `CLAUDE.md` — 重写为「入口 + 关键要点」
3. `.github/copilot-instructions.md` — 重写为纯入口
4. `.agents/skills/stellar-theme-dev/SKILL.md` — 引用改指 AGENTS.md
5. `docs/guides/tag-plugins-style-guide.md` — ES5 → ES2015+
6. `docs/knowledge/tools/verify.py` — 硬事实异常退出码 1
7. `docs/knowledge/VERIFICATION.md` — 更新 HEAD 记录（收尾提交）
8. `docs/designs/2026-08-12-ai-spec-fixes/` — 本方案文档

命令表述同步（与第 2 项同一逻辑）：`.github/PULL_REQUEST_TEMPLATE.md`、`docs/designs/_template/checklist.md`、`ci/gulpfile.js` 注释。

## 实施顺序

1. 建方案文档（本目录）
2. 重写 AGENTS.md / CLAUDE.md / copilot-instructions.md
3. 更新 skill 与 tag-plugins-style-guide
4. 修改 verify.py
5. 验证（npm run check、负向用例、grep 校验）
6. 三个 Conventional Commits 提交，不 push

## 完成条件

- `npm run check` 退出码 0
- verify.py 负向用例退出码 1
- grep 确认过期表述清零（历史设计文档除外）
- 三份规范文件层级声明一致
