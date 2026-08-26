# AGENTS.md — Stellar 主题仓库 AI 规范

> 本文件是 hexo-theme-stellar 主题仓库的 **AI 协作唯一权威规范**，供所有 AI 编码工具（Codex、Claude Code、Cursor、Copilot、Trae 等）与开发者共同遵守；`CLAUDE.md` 与 `.github/copilot-instructions.md` 是兼容入口，冲突以本文件为准。
> `$stellar-theme-dev` skill（Codex：`.agents/skills/`；Claude Code：`.claude/skills/`，逐字一致，CI 强制同步）负责执行顺序；验证范围以本文件 §5 的风险分级为唯一事实来源。

## Agent skills

### Issue tracker

工程 skills 创建、读取或发布 spec、ticket 和 issue 时使用 `xaoxuu/hexo-theme-stellar` GitHub Issues；操作约定见 `docs/agents/issue-tracker.md`。

### Domain docs

工程 skills 探索代码库、命名领域概念或检查架构决策时，按 single-context 规则读取领域文档；消费规则见 `docs/agents/domain.md`。

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
- `VERIFICATION.md`：核查与修正记录；`npm run knowledge:check`：知识库硬事实门禁

使用约定：

- 涉及主题代码、配置或行为问题时，按需查阅 `docs/knowledge/` 对应领域，再读源码确认；局部改动无需加载总览或无关领域
- 知识库以本仓库代码为唯一事实来源；公开契约、架构事实或关键阈值变化时更新对应页面，发现既有事实错误时登记到 `VERIFICATION.md`
- 修改知识库后运行 `npm run knowledge:check`；仓库内链接、公开主题配置引用和当前版本引用必须零错误，语义正确性按 §5 的文档同步核验确认

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

流程总览：**定界 → 开发 → 按风险验证 → 按需文档同步 → 提交 / 发版**。Codex 与 Claude Code 涉及主题开发、验证或发版时，先调用 `$stellar-theme-dev` skill，按其中的执行顺序与完成条件推进；其他环境（Cursor、Copilot、Trae 等）按下述门禁执行；skill 与本节冲突时，以本节为准。

**方案门禁**：跨域架构、迁移或兼容取舍、分发/发布工作、需长期保留的产品决策，以及用户明确要求方案的任务，先在 `docs/designs/{YYYY-MM-DD}-{功能简称}/` 写方案。局部修复、样式微调、单字段配置和文档维护直接实现；已有方案时更新原方案，不新建重复记录。方案只记录环境无法自证的决策、边界与验收标准。

**验证门禁：最小充分验证**

先选择能覆盖实际影响的最低级别；路径、文件数量、v2 标签或“公开字段”不单独升级风险。若定向检查暴露更大影响，或无法界定影响范围，再升级一级。

| 级别 | 适用范围 | 必要证据 |
| --- | --- | --- |
| **F0 文档** | 说明、流程、skill、方案或注释，不改变运行行为 | 相关格式、链接、引用或事实检查；知识库改动运行 `npm run knowledge:check` |
| **F1 定向**（默认） | 局部 CSS/EJS/浏览器 JS/helper、单个配置字段或可界定行为 | 直接相关的单测、lint、CSS 编译或渲染检查；Schema 改动执行 `npm run schema:generate` 与 `npm run schema:check`；只有跨过 Hexo 渲染/资源编译边界且定向检查不能证明时才在主工程运行 `npm run g` |
| **F2 全仓** | 跨域公共运行时、共享模型/Collection 管线、构建链、依赖、广泛重构，或影响范围仍不确定 | `npm run check`；影响真实站点渲染时再加主工程 `npm run g` |
| **F3 分发** | npm 包安装、CLI/init、Blueprint、迁移流程、发布，或明确的阶段/人工验收任务 | F2 + `npm run integration:check`；仅在准备人工验收制品时运行 `npm run acceptance:prepare` |

UI 视觉判断只在用户要求或自动检查无法证明目标时进行；需要时用 `npm run s` 提供人工预览。已经通过的高层门禁，在后续仅修改文档、Reference 元数据或记录时，只重跑覆盖新增 diff 的检查；F3 制品任务则以最终制品内容为准。

完成条件：每个受影响契约都有一项可复查证据，所选级别的检查通过；新增 `require` 均已声明或为 Node 内置模块（`test/` 禁止幽灵依赖）。CI 的全量检查继续作为 PR 合并门禁，不要求每个本地微调重复执行。

**文档同步核验（提交前）**：

1. 阅读最终功能 diff，逐项列出行为、配置、API、UI 与兼容性变化，并为每项变化确认文档落点。
2. 公开行为、配置契约、架构事实或关键阈值变化时更新对应 `docs/knowledge/`；修正既有事实偏差时登记 `VERIFICATION.md`；用户可配置或公开功能变化时同步仓库 Wiki。内部重构和不改变契约的视觉参数微调无需新增知识库记录。
3. 对照最终实现核验说明、示例、字段名、默认值、边界与失败行为；文档文件发生过修改不等于内容已经同步。
4. 运行风险级别要求的适用检查；存在方案时把结果写入 `checklist.md`。存在遗漏、过时描述或未完成项时继续修改，不进入提交。

完成条件：每项需要公开或长期维护的变化都有与最终实现一致的文档落点；适用检查全部通过。

**提交门禁**：

- **交付提交**：同一需求的实现、测试、知识库、公开文档、方案状态与验证记录属于一个交付单位；文档同步核验完成后一次性暂存并提交。提交产生的 SHA 只用于 issue 评论与发布输出，不回写仓库台账
- 遵循 §7 Git 规范：一次提交对应一个需求点，逻辑相似的需求可合并；改动默认保留在工作区供审查，仅在用户明确要求提交时 commit，仅在明确要求推送时 push

**新增功能检查面**（只覆盖实际相关维度）：

1. `layout/` — EJS 模板
2. `scripts/` — Hexo 标签 / 辅助函数 / 过滤器
3. `source/css/` — Stylus 样式
4. `source/js/` — 浏览器脚本（如需）
5. `docs/` — 触发方案门禁时记录方案与验证结果
6. `languages/` — 国际化文案（如需新增文本）
7. `docs/knowledge/` — 公开契约、架构事实或关键阈值变化时同步更新

## 6. 架构总览

跨域架构或无法定位影响范围时，阅读 `docs/knowledge/00-总览与安装配置/overview.md` 建立整体认知。局部任务读取对应领域页面即可；细节以知识库为索引、代码为最终事实来源。

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
- **确认**：向用户列出版本号和变更摘要，等待确认
- **执行**：`npm run release:dry -- <version>` 预演通过后，`npm run release -- <version>`（非交互环境加 `--yes`）

完整脚本职责、CI 自动化、失败处理与发版 Checklist 见 `docs/guides/release-process.md`。

## 9. 关键约束

- 不引入新构建系统，保持 Hexo 原生 + Gulp 后处理
- 不混用 EJS 与前端框架语法
- CSS 兼容 IE8，JS 兼容 ES2015+
- 新增或重构标签插件时，先遵循 `docs/guides/tag-plugins-style-guide.md`

## 10. Issue 处理

- 普通 issue 调查后，先询问用户是否进行回复，得到确认后再发出回复或处理
- 回复已修复的 issue 时，**不要手动关闭 issue**，只需添加 `resolved` 标签
- 关闭由 label-commenter CI（`.github/workflows/label-commenter.yml`）处理：检测到 `resolved` 标签后自动关闭并附上回复；`fixed`、`duplicate`、`wontfix` 等标签同样由 CI 处理，agent 不直接调用 close
