# CLAUDE.md — Claude Code 项目指南

@AGENTS.md

> 本仓库的完整 AI 工程规范见 [AGENTS.md](AGENTS.md)，请优先阅读并遵守。以下为关键要点，内容如有出入以 AGENTS.md 为准。

## 项目

这是 Hexo 主题 **Stellar** 的独立仓库，主题以 npm 包形式发布，被 [xaoxuu.com](https://xaoxuu.com) 等站点通过 git submodule 引用（`themes/stellar/`）。本仓库负责主题代码（`layout/`、`scripts/`、`source/`）、国际化文案（`languages/`）、文档（`docs/`）与版本发布。

## 关键要点

- 主题开发、验证或发版：调用 `stellar-theme-dev` skill（位于 `.claude/skills/stellar-theme-dev/`）作为执行清单，规范以 AGENTS.md 为准
- 技术栈：EJS 模板、Stylus 样式、服务端 CommonJS（Node 22+，现代语法）、浏览器 ES2015+（源码，Babel 转译输出）、YAML 文案
- 涉及主题代码、配置或行为问题时，先查 `docs/knowledge/` 对应领域，再读源码确认；知识库与代码不一致时以代码为准
- 修改 `scripts/` 后必须在主工程（xaoxuu.com，以 `themes/stellar` 子模块依赖本仓库）中执行 `npm run g` 全量验证（已含 `hexo generate` + gulp minify）；`npm run s` 是按需渲染，不能替代
- 本地一键检查：`npm run check`（lint + 单测 + 知识库硬事实核查）
- 提交使用 Conventional Commits；只有用户明确要求时才 push
- 发版前须与用户确认版本号与变更摘要，先 `npm run release:dry -- <version>` 预演，再 `npm run release`
- Issue 处理：回复已修复的 issue 时只添加 `resolved` 标签，不手动关闭；关闭由 label-commenter CI 处理
