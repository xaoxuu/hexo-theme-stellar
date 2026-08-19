# AGENTS.md — Stellar 主题仓库 AI 规范

> 本文件是 hexo-theme-stellar 主题仓库的 **AI 协作唯一权威规范**，供所有 AI 编码工具（Codex、Claude Code、Cursor、Copilot、Trae 等）与开发者共同遵守；`CLAUDE.md` 与 `.github/copilot-instructions.md` 是兼容入口，冲突以本文件为准。
> `$stellar-theme-dev` skill（Codex：`.agents/skills/`；Claude Code：`.claude/skills/`，逐字一致，CI 强制同步）是本流程的执行清单；Codex 与 Claude Code 涉及主题开发、验证或发版时先调用它，其他环境直接按本文件 §5 门禁执行。

## 1. 仓库职责与协作边界

这是 Hexo 主题 **Stellar** 的独立仓库，主题以 npm 包形式发布，被 [xaoxuu.com](https://xaoxuu.com) 等站点通过 git submodule 引用。

**本仓库负责：**

- 主题代码：EJS 模板（`layout/`）、Hexo 服务端脚本（`scripts/`）、Stylus 样式（`source/css/`）、浏览器 JS（`source/js/`）
- 国际化文案（`languages/`）与主题文档（`docs/`）
- 版本发布：版本号更新、npm publish、git tag（遵循发版规范）

**本仓库不负责：**

- 博客内容：文章、草稿、Wiki、笔记、友链等（归 xaoxuu.com 主工程）
- 站点配置：站点根 `_config.yml`、`_config.stellar.yml`、部署配置（归使用方站点；本仓库自带 `_config.yml` 为主题默认配置）
- 站点私有数据：不把具体站点的内容、图片、数据打包进主题

**协作边界：**

- 主题无法单独运行，开发调试以主工程为项目；在主工程的 `themes/stellar/` 内直接修改主题代码是正常场景
- 改动必须在本仓库独立提交、发布；主工程的提交只允许更新子模块指针，不得包含主题源码
- 主题行为变更（渲染、样式、交互、配置项）由本仓库发版，主工程负责升级子模块指针

## 2. 技术栈与代码定位

- 模板引擎 EJS；样式 Stylus；服务端 JS CommonJS（Node 22+，现代语法）；浏览器 JS ES2015+（源码，Babel 转译输出）；文案 YAML；文档 Markdown

| 想做什么 | 去哪里改 |
|---------|---------|
| 改样式 / 设计令牌 | `source/css/_defines/`、`source/css/_components/` |
| 新增自定义标签 | `scripts/tags/lib/` + `scripts/tags/index.js` 注册 + `source/css/_components/tag-plugins/` 样式 |
| 页面结构 / 模板 | `layout/`（`layout.ejs` 编排、`_partial/` 组件） |
| 前端交互 | `source/js/plugins/`（源码 ES2015+，Babel 转译输出） |
| 数据服务 / 小部件 | `source/js/services/`、`layout/_partial/widgets/` |
| 评论系统 | `layout/_partial/comments/` |
| 构建期逻辑 | `scripts/`（helpers / filters / generators / events / commands） |
| 文案 | `languages/` |

完整目录结构以仓库实际布局为准（`layout/`、`scripts/`、`source/`、`languages/`、`docs/`）。

## 3. 主题知识库与文档归档

主题仓库内置面向 AI 贡献者的中文知识库 `docs/knowledge/`：

- `00-总览与安装配置/` ~ `09-高级主题/`：按主题域组织，入口为 `docs/knowledge/README.md` 及各领域 `index.md`
- `VERIFICATION.md`：核查与修正记录；`tools/verify.py`：硬事实核查脚本

使用约定：

- 涉及主题代码、配置或行为问题时，先查阅 `docs/knowledge/` 对应领域，再读源码确认
- 知识库以本仓库代码为唯一事实来源；发现不一致时修正知识库，并登记到 `VERIFICATION.md`
- 主题升级或行为变更后，运行 `python3 docs/knowledge/tools/verify.py` 复查硬事实；核查门禁：版本不一致或行号引用越界即失败（退出码非 0），未解析文件与配置键异常仅报告不阻断

知识库写作遵循“设计语义、行为契约、修改依据”分层：公共设计令牌集中记录在 `01-样式系统/design-tokens.md`，各领域页面只保留本领域的行为、布局契约、公开配置和关键阈值，具体 CSS/模板/JS 实现以源码为最终事实来源，历史取舍放在 `docs/designs/`。新增数值必须说明语义和作用范围；普通实现值仅在影响决策、兼容性或验收时记录；同一事实只维护一个权威位置，其他页面通过链接引用。

文档统一归档在 `docs/`：`audits/` 代码审计；`designs/` 设计方案；`guides/` 流程指南；命名 `{YYYY-MM-DD}-{功能简称}.md`（流程性文档可不带日期），多步骤任务用 `docs/designs/{YYYY-MM-DD}-{功能简称}/` 目录（模板 `docs/designs/_template/`，含 `spec.md` / `plan.md` / `checklist.md`）。

## 4. 编码规范

### EJS 模板

- `<% %>` 逻辑控制，`<%- %>` 输出非转义 HTML
- 变量声明用 `var`（IE8 兼容）
- 2 空格缩进，HTML 属性双引号
- 可复用片段提取到 `_partial/`；复杂逻辑提取到 `helpers/` 辅助函数

```ejs
<%
var items = site.posts.sort('date', -1).limit(10)
items.forEach(function(post) {
%>
  <article>
    <%- partial('_partial/main/post_list/post_card', {post: post}) %>
  </article>
<%
})
%>
```

### Node.js 脚本

- CommonJS: `require()` / `module.exports`
- 文件头: `/* global hexo */` + `'use strict';`
- 2 空格缩进，双引号，分号结尾（新增代码遵循；存量代码风格不一，暂未由 lint 强制）
- 标签注册: `hexo.extend.tag.register(name, handler, options)`；辅助函数注册: `hexo.extend.helper.register(name, handler)`
- 新增 `require()` 先确认归属：`test/` 只引用 `package.json` 已声明依赖或 Node 内置模块（防幽灵依赖，`npm test` 自动检查）；`scripts/` 可依赖 hexo 宿主提供的模块（如 `hexo-util`），因为主题只在 hexo 项目内运行

```js
/* global hexo */
'use strict';

module.exports = function(hexo) {
  return function(args, content) {
    var result = '';
    // ...
    return result;
  };
};
```

### Stylus 样式

- 文件引入顺序: `const` → `custom` → `theme_base` → `theme_colorful` → `func`
- 类名和文件名: `kebab-case`
- 变量在 `_defines/`，通用样式在 `_common/`，组件在 `_components/`
- 2 空格缩进，属性后空格

### 浏览器 JS

- 源码使用 ES2015+ 语法（Gulp Babel 转译输出）
- 避免直接操作 DOM，使用主题工具函数
- 注释: `//` 单行，`/* */` 多行

## 5. 工作流程

流程总览：**方案 → 开发 → 验证 → 提交 → 发版**。Codex 与 Claude Code 涉及主题开发、验证或发版时，先调用 `$stellar-theme-dev` skill，按其中的执行顺序与完成条件推进；其他环境（Cursor、Copilot、Trae 等）按下述门禁执行；skill 与本节冲突时，以本节为准。

**方案门禁**：涉及行为、结构或多文件改动的任务，先在 `docs/designs/{YYYY-MM-DD}-{功能简称}/` 写方案文档（模板 `docs/designs/_template/`），写明：要解决的问题或新增的能力、技术方案和实现思路、影响范围（涉及哪些文件/模块）、需要同步的知识库页面与文档。方案中必须先列出可复用的配置、设计令牌、mixin、partial、helper、`utils.js` 或公共服务入口，再说明新增定义；新增常量或变量必须记录语义、作用域、消费方、默认值来源和配置边界；跨页面能力优先设计可复用接口（例如批量挂载入口），并写明初始化、失败降级、暂停和销毁行为。

**验证门禁**：

- `scripts/` 有改动 → 必须在主工程（xaoxuu.com）执行 `npm run g` 全量验证（已含 `hexo clean && hexo generate && npx gulp minify`，可发现模板渲染错误与 HTML 结构错误）；`npm run s` 是按需渲染，不能替代
- 新增/修改纯函数 → 补充单测并跑 `npm run check`（lint + 单测 + 依赖声明检查 + 知识库硬事实核查）
- 知识库有改动 → `python3 docs/knowledge/tools/verify.py` 硬事实核查
- UI 方面（样式、模板、前端交互等）改动量不大时无需自检流程，除非用户明确要求
- 检查所有受影响页面类型（首页、文章页、Wiki 页等），验证结果记录在方案目录 `checklist.md`
- CI（`.github/workflows/ci.yml`）会在 PR 上强制 lint、单测、Conventional Commits、demo 全量构建 + minify 与知识库核查；等价流程为 demo 工程 `npx hexo generate` + `npx gulp minify`
- 完成条件：应执行的命令全部通过；新增 `require` 均已声明或为 Node 内置模块（`test/` 禁止幽灵依赖）

**提交门禁**：

- 遵循 §7 Git 规范：一次提交对应一个需求点，逻辑相似的需求可合并；不自动提交，改动保留在工作区供审查，仅在用户明确要求时提交（发版流程除外）与 push

**文档同步门禁**：

- 涉及主题代码、配置或行为变化时，必须同步更新 `docs/knowledge/` 并在 `VERIFICATION.md` 登记；涉及逻辑变更（API、配置项、行为变化）时同步更新仓库 Wiki
- 发版前 `npm run check` 内含提交登记完整性检查：自上一 tag 起涉及主题代码、配置或行为变化的非合并提交须在 `docs/knowledge/VERIFICATION.md`「提交登记（发版前核对）」表登记短 SHA（纯文档 / CI / 工具改动无需登记），缺失即失败（`ci/check-release-docs.js`）

**新增功能 Checklist**（必须覆盖全部相关维度）：

1. `layout/` — EJS 模板
2. `scripts/` — Hexo 标签 / 辅助函数 / 过滤器
3. `source/css/` — Stylus 样式
4. `source/js/` — 浏览器脚本（如需）
5. `docs/` — 方案 + 执行计划 + 测试记录
6. `languages/` — 国际化文案（如需新增文本）
7. `docs/knowledge/` — 涉及主题代码、配置或行为变化时同步更新

## 6. 架构总览

动手改代码前，先阅读 `docs/knowledge/00-总览与安装配置/overview.md` 建立整体认知，它覆盖：五层架构（配置 / 数据处理 / 服务端渲染 / 客户端 / 样式）、四阶段渲染流水线、配置级联（页面级 > 项目级 > 主题默认）、四套并行内容系统（博客 `post`、文档 `wiki`、专栏 `topic`、笔记本 `note`）。细节以知识库为准，冲突以代码为准。

## 7. Git 规范

使用 Conventional Commits：

```
<type>(<scope>): <description>
```

| Type | 说明 |
|------|------|
| `feat` | 新功能 |
| `fix` | Bug 修复 |
| `refactor` | 重构 |
| `perf` | 性能优化 |
| `style` | CSS/样式修改 |
| `docs` | 文档更新 |
| `chore` | 构建/依赖等杂项 |
| `content` | 内容维护 |
| `release` | 发版提交 |

> 完整白名单以 `ci/check-commit-msg.js` 为准（CI 强制执行）。

- 一次提交对应一个需求点；逻辑相似的需求可以合并为一次提交
- 合并代码时，把合并提交 / PR 标题改为 Conventional Commits 格式（`<type>(<scope>): <description>`，类型见上表），不保留默认的 `Merge branch ...` / `Merge pull request ...` 标题
- 与 issue 相关的提交，在提交标题末尾带上 issue 号（用户已提供 issue 号或链接时），如 `fix(scope): 修复 xxx (#123)`
- 每个需求完成后不自动提交，改动保留在工作区供用户审查（见 §5 提交门禁）
- 只有用户明确要求时才 push；发版前须与用户确认版本号

## 8. 发版规范

发版一键全自动：AI/人工提前在 `CHANGELOG.md` 准备待发布版本的非空章节，Node 脚本校验非空并更新版本号后推送 → CI 自动完成 npm 发布、tag 创建与 GitHub Release。发版前脚本自动执行 `npm run check`，任一失败即中止。

```
npm run release → push main + npm → CI 自动触发 → npm publish + git tag + GitHub Release
```

门禁：

- **版本号推导**（自上一个 tag 起分析 commit）：仅含 fix / perf / style → `x.y.(z+1)`；含 feat / refactor / breaking change → `x.(y+1).0`；大型重构、用户可感知的设计调整 → `(x+1).0.0`；测试版本 → `x.y.z-rc.N`
- **CHANGELOG**：AI/人工先写入 `## <version>` 非空章节（H2 版本号 + H3 分类，格式见 `docs/guides/release-process.md`）
- **提交登记**：自上一 tag 起涉及主题代码、配置或行为变化的非合并提交须在 `docs/knowledge/VERIFICATION.md`「提交登记（发版前核对）」表登记短 SHA（纯文档 / CI / 工具改动除外）；`npm run check` 内含完整性检查，缺失即中止发版
- **确认**：向用户列出版本号和变更摘要，等待确认
- **执行**：`npm run release:dry -- <version>` 预演通过后，`npm run release -- <version>`（非交互环境加 `--yes`）

完整脚本职责、CI 自动化、失败处理与发版 Checklist 见 `docs/guides/release-process.md`。

## 9. 关键约束

- 不引入新构建系统，保持 Hexo 原生 + Gulp 后处理
- 不混用 EJS 与前端框架语法
- CSS 兼容 IE8，JS 兼容 ES2015+
- 新增或重构标签插件时，先遵循 `docs/guides/tag-plugins-style-guide.md`

## 10. Issue 处理

- 调查 issue 问题后，先询问用户是否进行回复，得到确认后再发出回复或处理
- 回复已修复的 issue 时，**不要手动关闭 issue**，只需添加 `resolved` 标签
- 关闭由 label-commenter CI（`.github/workflows/label-commenter.yml`）处理：检测到 `resolved` 标签后自动关闭并附上回复；`fixed`、`duplicate`、`wontfix` 等标签同样由 CI 处理，agent 不直接调用 close
