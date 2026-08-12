# 贡献指南

感谢你考虑为 [Stellar](https://github.com/xaoxuu/hexo-theme-stellar) 贡献代码或文档！Stellar 是一个功能强大的综合型 Hexo 主题，内置博客、知识库、专栏、笔记四大系统，并提供丰富的标签组件与动态数据组件。

本指南面向开发者，描述从环境准备、开发、验证到提交 PR 的完整流程；主题仓库的 AI 协作规范（唯一权威）见 [AGENTS.md](AGENTS.md)。使用上的问题请先查阅 [Wiki 文档](https://xaoxuu.com/wiki/stellar/)。

## 仓库与职责边界

| 仓库 | 职责 |
|------|------|
| [hexo-theme-stellar](https://github.com/xaoxuu/hexo-theme-stellar) | 主题代码（`layout/`、`scripts/`、`source/`）、国际化（`languages/`）、主题文档（`docs/`）、版本发布 |
| [xaoxuu.com 主工程](https://github.com/xaoxuu/xaoxuu.com) | 博客站点，以 git submodule 方式引用本主题；只更新子模块指针，不包含主题源码 |
| [hexo-theme-stellar-docs](https://github.com/xaoxuu/hexo-theme-stellar-docs) | Wiki 文档内容（对应 xaoxuu.com/wiki/stellar/） |
| [hexo-theme-stellar-examples](https://github.com/xaoxuu/hexo-theme-stellar-examples) | 官方示例工程（`blog` 博客场景、`docs` 文档场景），用于集成开发与验证 |

主题无法单独运行，开发调试需要在主工程或官方 demo 工程中集成。

## 环境准备

```yaml
Hexo: 6.3.0 ~ latest（已验证至 8.1.2）
hexo-cli: 4.3.0 ~ latest
node: >= 22 # 建议选择 LTS 版本
npm: >= 10
```

推荐使用官方 demo 工程集成开发：

1. Fork 本仓库并克隆到本地。
2. 克隆 [hexo-theme-stellar-examples](https://github.com/xaoxuu/hexo-theme-stellar-examples)，将你的主题副本放到 `blog/themes/stellar`（或 `docs/themes/stellar`）。
3. 在 demo 工程中执行 `npm install`，然后按需 `npx hexo generate` / `npx gulp minify` 构建验证。

也可以使用 git submodule 将主题挂载到自己的博客或主工程：

```bash
git submodule add https://github.com/<your-name>/hexo-theme-stellar.git themes/stellar
```

## 开发流程

每个功能或修复请按以下顺序推进，产物保留在仓库中。

### 1. 方案

在 `docs/designs/{YYYY-MM-DD}-{功能简称}/` 下创建方案文档（模板见 `docs/designs/_template/`），包含 `spec.md` / `plan.md` / `checklist.md`，写明：

- 要解决的问题或新增的能力
- 技术方案和实现思路
- 影响范围（涉及哪些文件 / 模块）
- 需要同步的知识库页面与文档

### 2. 实施

新增功能覆盖全部相关维度：

| 维度 | 目录 | 说明 |
|------|------|------|
| 模板 | `layout/` | EJS 模板与可复用 partial |
| 服务端脚本 | `scripts/` | Hexo 标签 / 辅助函数 / 过滤器 |
| 样式 | `source/css/` | Stylus 样式 |
| 浏览器脚本 | `source/js/` | ES2015+ 源码（Gulp Babel 转译输出） |
| 国际化 | `languages/` | 新增文案时同步 |
| 文档 | `docs/` | 方案 + 执行计划 + 测试记录 + 知识库同步 |

### 3. 文档与知识库同步

涉及主题代码、配置或行为变化时，必须同步更新 `docs/knowledge/` 并在 `docs/knowledge/VERIFICATION.md` 登记；涉及逻辑变更（API、配置项、行为变化）同时更新仓库 Wiki。

## 编码规范摘要

完整规范见 `AGENTS.md` §6，核心要求：

- **EJS 模板**：`<%- %>` 输出非转义 HTML；变量声明用 `var`（IE8 兼容）；2 空格缩进；HTML 属性双引号；复杂逻辑提取到 `helpers/`
- **Node 脚本**：CommonJS（`require()` / `module.exports`）；文件头 `/* global hexo */` + `'use strict';`；2 空格缩进、双引号、分号结尾
- **Stylus 样式**：类名和文件名 `kebab-case`；变量在 `_defines/`，通用样式在 `_common/`，组件在 `_components/`；2 空格缩进
- **浏览器 JS**：ES2015+ 语法；避免直接操作 DOM，使用主题工具函数
- **不引入新构建系统**，保持 Hexo 原生 + Gulp 后处理；CSS 兼容 IE8，JS 兼容 ES2015+
- 新增或重构标签插件时，先阅读 `docs/guides/tag-plugins-style-guide.md`

## 测试与验证

在主题仓库根目录执行：

```bash
npm run lint       # ESLint
npm test           # node:test 单测
python3 docs/knowledge/tools/verify.py   # 知识库硬事实核查
npm run check      # 一键执行 lint + 单测 + 知识库核查
```

修改 `scripts/` 后**必须**在主工程（xaoxuu.com）执行全量验证：

```bash
npm run g          # hexo clean && hexo generate && npx gulp minify
```

> `npm run s`（本地按需渲染）不能替代全量验证。UI 方面（样式、模板、前端交互）改动量不大时无需执行自检流程，除非用户明确要求。

新增 / 修改纯函数时请补充单元测试。

## 提交规范

使用 Conventional Commits，一次提交对应一个需求点（逻辑相似的需求可以合并）：

```
<type>(<scope>): <description>
```

`type` 白名单（完整规则以 `ci/check-commit-msg.js` 为准）：`feat` / `fix` / `refactor` / `perf` / `style` / `docs` / `chore` / `content` / `release`。

- 任务完成后**不自动提交**：改动保留在工作区供审查
- 只有明确要求时才 push
- 发版流程除外（见下文）

## 提交 Pull Request

按 [PULL_REQUEST_TEMPLATE.md](.github/PULL_REQUEST_TEMPLATE.md) 填写 PR：

- **变更说明**：描述解决的问题或新增能力，附相关 issue 编号（如有）
- **改动范围**：勾选涉及维度（`layout/`、`scripts/`、`source/css/`、`source/js/`、`languages/`、`docs/`）
- **验证清单**：确认 lint / 单测 / 全量构建 / 知识库同步等已通过

CI 会在 PR 上强制执行以下检查，全部通过后才可合并：

| 检查 | 内容 |
|------|------|
| Lint | ESLint |
| Unit tests | node:test 单测 |
| Conventional Commits | 提交信息符合规范 |
| Skill mirror sync | `.agents/` 与 `.claude/` 技能镜像一致 |
| Integration build | 官方 demo 全量构建（hexo generate）+ Gulp minify |
| Knowledge base verify | `docs/knowledge/tools/verify.py` 硬事实核查 |

## 发版

发版由维护者（或明确授权的贡献者）执行，一键全自动：

```bash
npm run release -- <version> --yes
```

发版前需在 `CHANGELOG.md` 准备好对应版本的非空章节（H2 版本号 + H3 分类），脚本校验通过后自动更新版本号、推送并触发 CI 完成 npm 发布、tag 与 GitHub Release。完整流程见 [docs/guides/release-process.md](docs/guides/release-process.md)。

## 社区与支持

- [Issues](https://github.com/xaoxuu/hexo-theme-stellar/issues)：技术问题答疑、BUG 反馈
- [Discussions](https://github.com/xaoxuu/hexo-theme-stellar/discussions)：论坛、相关话题讨论
- [探索号](https://xaoxuu.com/wiki/stellar/articles/)：文章收录
- [社区支持页面](https://xaoxuu.com/wiki/stellar/contributors/)：开发者列表、社区渠道与提问建议

无论在什么渠道提问，建议先学习[「提问的智慧」](https://github.com/ryanhanwu/How-To-Ask-Questions-The-Smart-Way/blob/main/README-zh_CN.md)，描述清楚问题现象、尝试过程与报错信息，能帮助大家更高效地解决你的问题。

## 许可

本仓库基于 [MIT License](LICENSE) 开源。
