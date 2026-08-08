# AGENTS.md — Stellar 主题仓库 AI 规范

> 本文件是 hexo-theme-stellar 主题仓库的 AI 协作规范，供所有 AI 编码工具（Codex、Claude Code、Cursor、Copilot 等）与开发者共同遵守。
> 本文件定义仓库职责与协作边界；完整开发规范见同目录 [CLAUDE.md](CLAUDE.md)。

## 1. 仓库职责

这是 Hexo 主题 **Stellar** 的独立仓库，主题以 npm 包形式发布，被 [xaoxuu.com](https://xaoxuu.com) 等站点通过 git submodule 引用。

**本仓库负责：**

- 主题代码：EJS 模板（`layout/`）、Hexo 服务端脚本（`scripts/`）、Stylus 样式（`source/css/`）、浏览器 JS（`source/js/`）
- 国际化文案（`languages/`）与主题文档（`docs/`）
- 版本发布：版本号更新、npm publish、git tag（遵循发版规范）

**本仓库不负责：**

- 博客内容：文章、草稿、Wiki、笔记、友链等（归 xaoxuu.com 主工程）
- 站点配置：`_config.yml`、`_config.stellar.yml`、部署配置（归使用方站点）
- 站点私有数据：不把具体站点的内容、图片、数据打包进主题

## 2. 与主工程（xaoxuu.com）的协作边界

- 主工程通过 git submodule 以发布版本引用本仓库；`themes/stellar/` 只是本仓库的检出副本
- 主题无法单独运行，开发调试通常以主工程为项目：在主工程的 `themes/stellar/` 内直接修改主题代码是正常场景
- 但改动必须在本仓库独立提交、发布；主工程的提交只允许更新子模块指针，不得包含主题源码
- 主题行为变更（渲染、样式、交互、配置项）由本仓库发版，主工程负责升级子模块指针
- 本仓库不依赖也不感知使用方站点的私有内容；验证时可在自己的 Hexo 项目或主工程中集成测试

## 3. 技术栈

| 层级 | 技术 | 目录 |
|------|------|------|
| 模板引擎 | EJS | `layout/` |
| CSS 预处理 | Stylus | `source/css/` |
| 服务端 JS | CommonJS (ES5) | `scripts/` |
| 浏览器 JS | ES5（Babel 转译） | `source/js/` |
| 国际化 | YAML | `languages/` |
| 文档 | Markdown | `docs/` |

## 4. 关键规则

- 修改 `scripts/` 后必须全量验证：`npm run g && npx gulp minify`（`npm run s` 是按需渲染，不能替代）
- 不引入新构建系统，保持 Hexo 原生 + Gulp 后处理
- CSS 兼容 IE8，JS 兼容 ES2015+，不混用 EJS 与前端框架
- 新增功能覆盖维度：`layout/` + `scripts/` + `source/css/` + `source/js/`（如需）+ `docs/` + `languages/`（如需）
- 方案/审计/指南文档统一归档在 `docs/`（`designs/`、`audits/`、`guides/`）
- 发版遵循 release 流程（版本号规则、dry-run 预览、提交前与用户确认），详见 [CLAUDE.md](CLAUDE.md)

## 5. Git 与发布

- 使用 Conventional Commits：`feat` / `fix` / `refactor` / `perf` / `style` / `docs` 等
- 只有用户明确要求时才 push；发版前须与用户确认版本号
- 详细发版规范见 [CLAUDE.md](CLAUDE.md) 的「发版规范」与「AI 调用指南」

## 6. Issue 处理

- 调查 issue 问题后，先询问用户是否进行回复，得到确认后再发出回复或处理
- 回复已修复的 issue 时，**不要手动关闭 issue**，只需添加 `resolved` 标签
- label-commenter CI（`.github/workflows/label-commenter.yml`）检测到 `resolved` 标签后会自动关闭 issue 并附上回复
- 其他会触发关闭的标签（`fixed`、`duplicate`、`wontfix` 等）同样由 CI 处理，agent 不直接调用 close
