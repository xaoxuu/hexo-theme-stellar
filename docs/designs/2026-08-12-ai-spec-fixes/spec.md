# 方案：修正并重构 AI 工程规范

> 日期：2026-08-12

## 要解决的问题

审计发现主题仓库 AI 工程规范与仓库事实存在不一致：

1. 技术栈描述错误：AGENTS.md 与 copilot-instructions.md 称 `scripts/`、`source/js/` 为 ES5，实际为现代语法 / ES2015+（Babel 转译输出），且与 CLAUDE.md 自相矛盾
2. 验证命令 `npm run g` / `npm run s` 未指明执行位置：主题仓库 package.json 无 `g`/`s` 脚本，命令定义在主工程（xaoxuu.com）
3. 知识库硬事实核查脚本 verify.py 只报告不拦截，CI 门禁名不副实
4. 小问题：Commit type 白名单不全、`_config.yml` 职责表述歧义、copilot-instructions.md 过期、VERIFICATION.md HEAD 记录过期

## 决策

- 与父工程（xaoxuu.com）结构对齐：AGENTS.md 合并为唯一权威完整规范；CLAUDE.md 改为「入口 + 关键要点」；`.github/copilot-instructions.md` 改为纯入口
- verify.py 对硬事实异常（行号引用越界、版本不一致）设失败退出码；未解析文件与配置键异常保持报告式，不做全量清理

## 影响范围

- `AGENTS.md`、`CLAUDE.md`、`.github/copilot-instructions.md`
- `.agents/skills/stellar-theme-dev/SKILL.md`、`docs/guides/tag-plugins-style-guide.md`
- `docs/knowledge/tools/verify.py`、`docs/knowledge/VERIFICATION.md`
- 本目录（`docs/designs/2026-08-12-ai-spec-fixes/`）

## 需要同步的知识库页面

本次不修改主题行为，知识库正文无需更新；仅 VERIFICATION.md 登记核查时点。
