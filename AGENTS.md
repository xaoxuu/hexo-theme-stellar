# AGENTS.md — Stellar 主题仓库 AI 规范

> 本文件是 hexo-theme-stellar 的 AI 协作唯一权威规范；`CLAUDE.md` 与 `.github/copilot-instructions.md` 只作兼容入口。
> 开发、验证或发布主题时调用 `$stellar-theme-dev`；本文件拥有工程门禁，skill 只编排执行顺序。

## Agent pointers

- 创建、读取或更新 issue 时按 `docs/agents/issue-tracker.md`。
- 新增或重构标签插件时读取 `docs/guides/tag-plugins-style-guide.md`；修改配置、内容 profile、组件、Extension 或语言文案时读取 `docs/guides/contribution-architecture.md`。

## 1. 仓库边界

本仓库以 npm 包形式提供 Stellar 的模板、样式、脚本、默认配置、国际化、主题工程文档和发布产物。

- 使用方拥有内容、站点配置、版本引用与部署设施；主题不打包具体站点的私有内容、图片或数据。
- 仓库内证据优先证明主题契约。只有任务明确包含某个消费站点且仓库内证据不足时，才补充该站点自己的集成验证。
- 当前事实以 `_config.yml`、源码、Schema、测试和 `package.json` 为准；知识库只作发布快照与探索索引。

## 2. 工程约束

- EJS 使用 `<% %>` 控制、`<%- %>` 输出 HTML，变量保持 `var`；复用结构放入 partial，复杂逻辑放入 helper。
- Node.js 脚本使用 CommonJS；`test/` 只引用已声明依赖或 Node 内置模块，主题运行时可使用 Hexo 宿主提供的模块。
- Stylus 的共享变量归 `source/css/_defines/`，通用样式归 `_common/`，组件样式归 `_components/`；浏览器源码使用 ES2015+ 并由现有 Babel 管线转译。
- 保持 Hexo + EJS + Stylus + Gulp 构建边界；新增依赖、抽象、配置、兼容层或扩展点必须对应当前验收标准。

### 测试保留门禁

- 仓库测试只保护长期架构、工程规范与核心流程：配置与 Schema、安全与兼容边界、共享模型与运行时基础设施、构建、生成、迁移、分发和工程门禁。
- 仅当断言对应长期规范、不依赖当前产品方案，且失败意味着架构或核心流程损坏时，才留在 `test/` 或 CI；具体组件的视觉、文案、尺寸、图标、DOM/CSS 结构和交互细节不属于仓库契约。
- 具体需求在 `/private/tmp/stellar-acceptance-<task>/` 编写任务级测试或浏览器脚本；交付时报告命令、场景与结果，然后删除该目录。只有暴露长期架构或核心流程漏洞时，才提炼为组件无关的仓库测试。
- 新需求使旧断言失效时，替换任务级验收并删除过期断言；不为具体需求增加仓库 fixture、测试文件或 `package.json` 命令。

完成条件：每项仓库断言都同时满足长期规范、方案无关和核心损坏三项条件；任务级测试、入口和 fixture 在交付后无残留。

### 复用门禁

修改 Shell、Region、Sidebar、Widget、公共组件、标签插件或动态控件时：

1. 先搜索已有 capability、partial/helper/mixin、设计令牌和 `scripts/lib/internal-constants.js`。
2. 控件通过 `ui_classes` 或 `ctx.ui.classes` 选择能力；普通链接和局部受保护值例外登记在 `ci/reuse-rules.js` 并写明稳定边界与理由。
3. 新增共享令牌或内部策略字段时同步保护规则；运行 `npm run reuse:check`。

完成条件：受管控件均已分类，没有原始 capability 组合类或未登记的受保护值副本。

## 3. 文档

- 设计方案、架构决策、迁移或兼容取舍、发布计划和验收记录统一存放在 GitHub Issues，格式与操作权限按 `docs/agents/issue-tracker.md`；仓库不保存单次方案文档，已删除文档的历史由 Git 保存。
- `docs/guides/` 只保存长期维护规范，`docs/audits/` 保存阶段性审计，`docs/knowledge/` 保存当前行为与修改依据。局部修复、样式微调、单字段配置和普通文档维护直接实现。
- 机器契约与直接测试随实现保持当前；知识库、CHANGELOG 和版本级 `VERIFICATION.md` 在发版准备时按最终净变化集中同步。纯文档任务和事实纠错即时处理。
- 修改知识库后运行 `npm run knowledge:check`；具体发布步骤见 `docs/guides/release-process.md`。

## 4. 工作流程

### 发布基线

兼容、迁移、公开文档和回归面向最近公开发布版本及明确承诺维护的外部接缝。未发布方案、预览、tarball 和中间提交属于可替换候选，不为被替换候选增加别名、双读、迁移或兼容测试。

### 验证门禁

先选能覆盖实际影响的最低级别；路径、文件数量、v2 标签或“公开字段”不单独升级风险。证据不足或影响无法界定时才升级。

| 级别 | 适用范围 | 必要证据 |
| --- | --- | --- |
| **F0 文档** | 说明、流程、skill、issue 方案或注释 | 相关格式、链接、引用或事实检查；知识库改动加 `npm run knowledge:check` |
| **F1 定向**（默认） | 局部 CSS/EJS/浏览器 JS/helper、单个配置字段或可界定行为 | 最近的单测、lint、CSS 编译或渲染检查；Schema 改动执行对应的解析、校验与消费测试 |
| **F2 全仓** | 跨域公共运行时、共享模型/Collection 管线、构建链、依赖、广泛重构，或影响仍不确定 | `npm run check` |
| **F3 分发** | npm 包安装、CLI/init、Blueprint、迁移、发布或明确阶段验收 | F2 + `npm run integration:check`；仅在准备人工验收制品时运行 `npm run acceptance:prepare` |

- 性能契约相关任务显式运行 `npm run performance:check`；普通 F2 不承担性能基线。发版由 `npm run release:check` 组合性能与知识库门禁。
- 宿主集成属于任务目标且主题证据不足时补充消费方验证；UI 视觉判断仅在用户要求或自动检查无法证明时进行。
- 已通过的高层门禁在后续只修改说明或验收记录时不重复运行；F3 制品以最终内容为准。

完成条件：每个受影响契约都有一项通过的直接证据，验证停在最低充分级别。

### 交付门禁

- 实现、测试与相关 issue 共同组成一个开发交付；普通开发不提前刷新发布快照。
- 一次提交对应一个需求点；提交格式以 `ci/check-commit-msg.js` 为准。
- 默认把改动保留在工作区；用户明确要求 commit 时才提交，明确要求 push 时才推送。
- 用户要求发布时，按 `docs/guides/release-process.md` 准备 CHANGELOG、确认版本并执行发布流程。

## 5. Issue 处理

- 调查后先获得用户授权，再代表用户回复或修改 issue 状态。
- 已修复 issue 添加 `resolved` 标签；关闭和自动回复由 `.github/workflows/label-commenter.yml` 处理。
