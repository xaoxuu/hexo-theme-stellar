# AGENTS.md — Stellar 主题仓库 AI 规范

> 本文件是 hexo-theme-stellar 主题仓库的 **AI 协作唯一权威规范**，供所有 AI 编码工具（Codex、Claude Code、Cursor、Copilot、Trae 等）与开发者共同遵守。
> `CLAUDE.md` 与 `.github/copilot-instructions.md` 是本文件的兼容入口，内容如有出入，以本文件为准。
> `$stellar-theme-dev` skill（Codex 的 `.agents/skills/` 与 Claude Code 的 `.claude/skills/`）是本流程的执行清单，本文件始终是唯一权威，冲突以本文件为准。
> Codex 与 Claude Code 涉及主题开发、验证或发版时，先调用 `$stellar-theme-dev` skill；其他环境直接按本文件 §7/§9/§10 流程执行。

## 1. 仓库职责

这是 Hexo 主题 **Stellar** 的独立仓库，主题以 npm 包形式发布，被 [xaoxuu.com](https://xaoxuu.com) 等站点通过 git submodule 引用。

**本仓库负责：**

- 主题代码：EJS 模板（`layout/`）、Hexo 服务端脚本（`scripts/`）、Stylus 样式（`source/css/`）、浏览器 JS（`source/js/`）
- 国际化文案（`languages/`）与主题文档（`docs/`）
- 版本发布：版本号更新、npm publish、git tag（遵循发版规范）

**本仓库不负责：**

- 博客内容：文章、草稿、Wiki、笔记、友链等（归 xaoxuu.com 主工程）
- 站点配置：站点根 `_config.yml`、`_config.stellar.yml`、部署配置（归使用方站点；本仓库自带 `_config.yml` 为主题默认配置）
- 站点私有数据：不把具体站点的内容、图片、数据打包进主题

## 2. 与主工程（xaoxuu.com）的协作边界

- 主工程通过 git submodule 以发布版本引用本仓库；`themes/stellar/` 只是本仓库的检出副本
- 主题无法单独运行，开发调试以主工程为项目：在主工程的 `themes/stellar/` 内直接修改主题代码是正常场景
- 但改动必须在本仓库独立提交、发布；主工程的提交只允许更新子模块指针，不得包含主题源码
- 主题行为变更（渲染、样式、交互、配置项）由本仓库发版，主工程负责升级子模块指针
- 本仓库不依赖也不感知使用方站点的私有内容；验证时在主工程或官方 demo 工程中集成测试

## 3. 技术栈

| 层级 | 技术 | 目录 |
|------|------|------|
| 模板引擎 | EJS | `layout/` |
| CSS 预处理 | Stylus | `source/css/` |
| 服务端 JS | CommonJS（Node 22+，现代语法） | `scripts/` |
| 浏览器 JS | ES2015+（源码），Babel 转译输出 | `source/js/` |
| 国际化 | YAML | `languages/` |
| 文档 | Markdown | `docs/` |

## 4. 目录结构

```
layout/                     # EJS 模板
├── _partial/               #   可复用组件
│   ├── main/               #     文章列表、导航、页脚
│   ├── sidebar/            #     侧栏组件
│   ├── cover/              #     封面
│   ├── comments/           #     评论系统
│   ├── widgets/            #     小部件
│   └── scripts/            #     脚本注入
├── _plugins/               #   可选插件片段
├── layout.ejs              #   根布局
├── index.ejs               #   首页
├── page.ejs                #   通用页面
└── archive.ejs             #   归档页
scripts/                    # Hexo 服务端脚本
├── tags/                   #   自定义标签 `{% tag %}`
│   └── lib/                #     标签实现
├── helpers/                #   EJS 辅助函数
├── filters/                #   Hexo 过滤器
├── generators/             #   页面生成器
├── events/                 #   事件处理
└── commands/               #   CLI 命令
source/                     # 浏览器端资源
├── css/                    #   Stylus 样式
│   ├── _defines/           #     变量和函数
│   ├── _common/            #     通用基础样式
│   ├── _components/        #     组件样式
│   └── _plugins/           #     插件样式
└── js/                     #   浏览器 JavaScript
    ├── plugins/            #     交互插件
    ├── services/           #     数据服务
    └── search/             #     搜索
```

## 5. 主题知识库

主题仓库内置一份面向 AI 贡献者的中文知识库，位于 `docs/knowledge/`：

- `00-总览与安装配置/` ~ `09-高级主题/`：按主题域组织，每个页面带 front matter 元数据与相对链接，入口为 `docs/knowledge/README.md` 及各领域 `index.md`
- `VERIFICATION.md`：核查与修正记录；`tools/verify.py`：硬事实核查脚本
- `知识库全量.md`：合并版（RAG / 一次性上下文导入）

使用约定：

- 涉及主题代码、配置或行为问题时，先查阅 `docs/knowledge/` 对应领域，再读源码确认
- 知识库以本仓库代码为唯一事实来源；发现不一致时修正知识库，并登记到 `VERIFICATION.md`
- 主题升级或行为变更后，运行 `python3 docs/knowledge/tools/verify.py` 复查硬事实
- 核查门禁：版本不一致或行号引用越界会失败（退出码非 0）；未解析文件与配置键异常仅报告，不阻断

## 6. 编码规范

### EJS 模板

- `<% %>` 逻辑控制，`<%- %>` 输出非转义 HTML
- 变量声明用 `var`（IE8 兼容）
- 2 空格缩进，HTML 属性双引号
- 可复用片段提取到 `_partial/`
- 复杂逻辑提取到 `helpers/` 辅助函数

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
- 标签注册: `hexo.extend.tag.register(name, handler, options)`
- 辅助函数注册: `hexo.extend.helper.register(name, handler)`

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

## 7. 工作流程

每次修改必须遵循以下流程，产物保留在仓库中。

### 7.1 方案

在 `docs/designs/{YYYY-MM-DD}-{功能简称}/` 目录下创建方案文档（模板见 `docs/designs/_template/`，包含 `spec.md` / `plan.md` / `checklist.md`），描述：

- 要解决的问题或新增的能力
- 技术方案和实现思路
- 影响范围（涉及哪些文件/模块）
- 需要同步的知识库页面与文档

### 7.2 执行计划

方案通过后，列出具体执行步骤，记录在对应文档中：

- 改动文件清单
- 分步实施顺序
- 依赖关系

### 7.3 测试

变更完成后，在主工程（xaoxuu.com，以 `themes/stellar` 子模块方式依赖本仓库）中集成验证：

- **`npm run g` 全量验证**（`scripts/` 变更必须执行）：`npm run g` 定义于主工程 package.json，已含 `hexo clean && hexo generate && npx gulp minify`，可发现模板渲染错误与 HTML 结构错误（如多余引号等）
- `npm run lint` 与 `npm test`（新增/修改纯函数时补充单测）
- `python3 docs/knowledge/tools/verify.py` 知识库硬事实核查（版本/行号硬事实异常即失败；未解析文件与配置键仅报告）
- `npm run s` 启动本地服务（按需渲染，不能替代全量验证）
- 检查涉及的所有页面类型（首页、文章页、Wiki 页等）
- 验证浏览器兼容性
- 测试结果记录在 `docs/` 中

> 主题仓库自身不提供 `g`/`s` 脚本（见 `package.json`），上述命令均需在主工程中执行；CI（`.github/workflows/ci.yml`）的等价流程为 demo 工程 `npx hexo generate` + `npx gulp minify`。CI 会在 PR 上强制 lint、单测、Conventional Commits、demo 全量构建 + minify 与知识库核查；本地可用 `npm run check` 一键执行 lint + 单测 + 知识库核查。

### 7.4 文档归档

文档统一存放在 `docs/` 目录，按内容类型分三个子文件夹：

```
docs/
├── audits/              # 代码审计、分析报告
├── designs/             # 设计方案、技术方案
└── guides/              # 流程指南、操作手册
```

| 文件夹 | 用途 | 示例 |
|--------|------|------|
| `audits/` | 代码质量审计、安全性分析、架构评估 | `2026-08-08-stellar-analysis.md` |
| `designs/` | 功能设计方案、重构方案、技术选型 | `2026-08-08-pjax-removal-and-pretty-urls-fix.md` |
| `guides/` | 发版流程、操作手册、新手指南 | `release-process.md` |

- 文件命名: `{YYYY-MM-DD}-{功能简称}.md`，流程性文档可不带日期
- 多步骤任务使用 `docs/designs/{YYYY-MM-DD}-{功能简称}/` 目录（模板见 `docs/designs/_template/`），单文件方案可保留 `{YYYY-MM-DD}-{功能简称}.md` 形式
- 涉及主题代码、配置或行为变化时，必须同步更新 `docs/knowledge/` 并在 `VERIFICATION.md` 登记；涉及逻辑变更（API、配置项、行为变化）同时更新仓库 Wiki

### 7.5 新增功能 Checklist

新增功能必须覆盖以下维度:

1. `layout/` — EJS 模板
2. `scripts/` — Hexo 标签 / 辅助函数 / 过滤器
3. `source/css/` — Stylus 样式
4. `source/js/` — 浏览器脚本（如需）
5. `docs/` — 方案 + 执行计划 + 测试记录
6. `languages/` — 国际化文案（如需新增文本）
7. `docs/knowledge/` — 涉及主题代码、配置或行为变化时同步更新

## 8. 组件架构

### 8.1 自定义标签开发

1. 在 `scripts/tags/lib/` 下创建标签实现文件
2. 在 `scripts/tags/index.js` 中注册
3. 在 `source/css/_components/tag-plugins/` 添加对应样式
4. 推荐使用 `hexo` 参数传入，避免 `require('hexo')`

### 8.2 评论系统

- 接口目录: `layout/_partial/comments/`
- 每个评论系统提供 `layout.ejs` 和 `script.ejs`
- 遵循现有的配置驱动模式

## 9. Git 规范

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

- 一次提交只含一个逻辑改动
- 只有用户明确要求时才 push；发版前须与用户确认版本号

## 10. 发版规范

发版一键全自动：AI/人工提前在 `CHANGELOG.md` 准备待发布版本的非空章节，Node 脚本校验非空并更新版本号后推送 → CI 自动完成 npm 发布、tag 创建与 GitHub Release。发版前脚本自动执行 `npm run check`（lint + 单测 + 知识库核查），任一失败即中止。

```
npm run release → push main + npm → CI 自动触发 → npm publish + git tag + GitHub Release
```

### 10.1 使用方式

```bash
# 交互式发版（提示输入版本号，提交前二次确认）
npm run release

# 显式指定版本号
npm run release -- 1.34.1

# 非交互环境发版（必须显式传版本号，并用 --yes 确认）
npm run release -- 1.34.1 --yes

# 预演模式（仅显示改动，不提交/推送，执行后自动恢复）
npm run release:dry -- 1.34.1
```

CHANGELOG.md 的历史数据已于 2026-08-09 一次性从 GitHub Releases API 同步入库（统一 H2 版本号 / H3 分类格式）；此后每次发版的更新日志由 AI/人工提前写入，脚本只做非空校验。提交前脚本校验 CHANGELOG.md 已包含该版本的非空章节（`## <version>`），缺失或为空则拦截；内容由 AI/人工提前准备。

### 10.2 发版前 CHANGELOG 规范

格式要求：

- 二级标题为版本号：`## 1.37.0`（不带 `v` 前缀），可另起一行写 `> 发布日期：YYYY-MM-DD`
- 三级标题为分类：`### 新功能`、`### 修复`、`### 重构`、`### 优化`、`### 文档`、`### 样式`、`### 其他`、`### 升级注意（配置变更与破坏性改动）` 等
- 分类下用 `- ` 无序列表记录变更
- 新版本章节置于文件顶部（`# Changelog` 之后），历史章节按新→旧排列
- 每个版本章节末尾追加一行 `Full Changelog: [上一版本...当前版本](https://github.com/xaoxuu/hexo-theme-stellar/compare/上一版本...当前版本)`（最早版本无前一版本时可省略）
- AI 整理内容时可参考 `git log`（自上一个 tag 起）的 Conventional Commits，按 type 归类

### 10.3 AI 调用指南

1. **分析变更确定版本号**: 查看上一版本以来的 commit，按以下规则确定版本号：
   - `x.y.z` → `x.y.(z+1)`: 仅含 fix / perf / style（修复和优化，安全升级）
   - `x.y.z` → `x.(y+1).0`: 含 feat / refactor / breaking change（功能增减、一般重构）
   - `x.y.z` → `(x+1).0.0`: 大型重构，用户可感知的设计调整
   - `x.y.z` → `x.y.z-rc.N`: 测试版本
2. **准备 CHANGELOG**: 由 AI/人工在 CHANGELOG.md 中写入 `## <version>` 章节（H2 版本号 + H3 分类，含升级注意），脚本只做非空校验
3. **向用户确认**: 列出版本号和变更摘要，等待用户确认后再继续
4. **dry-run 预览**: `npm run release:dry -- <version>` 检查变更是否正确（同时校验 CHANGELOG.md 已包含该版本非空章节）
5. **正式执行**: `npm run release -- <version>`，提交前脚本会二次确认
6. **推送后自动发布**: 推送完成后 npm-publish workflow 自动触发（npm 分支 `release:` 提交），CI 负责 npm publish、tag 与 GitHub Release；如未自动触发或需重跑，可手动触发 workflow（默认 ref 为 npm）

## 11. 关键规则与约束

- 修改 `scripts/` 后必须完成全量验证（见 §7.3）；`npm run s` 是按需渲染，不能替代
- 不引入新构建系统，保持 Hexo 原生 + Gulp 后处理
- 不混用 EJS 与前端框架语法
- CSS 兼容 IE8，JS 兼容 ES2015+
- 新增或重构标签插件时，先遵循 `docs/guides/tag-plugins-style-guide.md`
- 方案/审计/指南文档统一归档在 `docs/`（详见 §7.4）
- 主题知识库统一维护在 `docs/knowledge/`（详见 §5）
- 发版遵循第 10 节 release 流程

## 12. Issue 处理

- 调查 issue 问题后，先询问用户是否进行回复，得到确认后再发出回复或处理
- 回复已修复的 issue 时，**不要手动关闭 issue**，只需添加 `resolved` 标签
- label-commenter CI（`.github/workflows/label-commenter.yml`）检测到 `resolved` 标签后会自动关闭 issue 并附上回复
- 其他会触发关闭的标签（`fixed`、`duplicate`、`wontfix` 等）同样由 CI 处理，agent 不直接调用 close
