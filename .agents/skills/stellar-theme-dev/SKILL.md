---
name: stellar-theme-dev
description: 开发、验证或发布 hexo-theme-stellar；普通开发按风险交付最终候选，发版时按发布基线集中同步文档。
---

# Stellar Theme Dev

主题仓库（hexo-theme-stellar）开发流程。仓库根 `AGENTS.md` 是唯一权威，本 Skill 只负责执行顺序。先按 `AGENTS.md` §5 将任务定为 F0–F3；纯文档使用 F0，局部实现默认 F1，证据不足时再升级。

## 流程

### 1. 定界

- 检查工作树，确认用户目标、直接受影响的契约和现有证据；从源码、Schema、生成 Reference 与测试定位当前事实，知识库只在能缩小探索范围时作为索引。
- 按 `AGENTS.md` §5 锁定发布基线与候选替换边界。
- 按 `AGENTS.md` §5 选择最低验证级别。触发方案门禁时创建或更新 `docs/designs/`；局部任务直接实现。
- 涉及 UI、样式或内部策略时执行 `AGENTS.md`「复用审计」：定位最近的 capability、partial/helper/mixin、令牌和内部常量，并为每个新增控件确定能力或 plain-link 理由。
- 完成条件：影响范围、发布基线和验证级别可界定；不存在把内部候选当成外部契约的兼容工作；每个新增控件与共享语义值已有明确复用入口或可登记的局部理由。

### 2. 开发

- 只修改实际相关维度；直接消费已确认的配置、capability、令牌、mixin、partial、helper、内部常量或公共服务。
- 标准 EJS 控件使用 `ui_classes`，标签插件调用同一 capability 组合函数，浏览器动态控件读取 `ctx.ui.classes`；普通链接例外和局部受保护值例外写入 `ci/reuse-rules.js` 并提供稳定选择器/字段与理由。
- 新增设计令牌或非地址内部策略字段时同步增加保护规则，确保消费方重新硬编码规范值会使 `npm run reuse:check` 失败。
- 方案与实现直接表达当前最终候选；候选变化时替换旧结论、旧兼容路径和只服务旧候选的测试，过程历史由 Git 保存。
- 新增或重构标签插件先读 `docs/guides/tag-plugins-style-guide.md`；代码遵循 `AGENTS.md` 编码规范。
- 完成条件：实现覆盖目标契约，没有扩大任务范围；公开文案已本地化。

### 3. 验证

严格按 `AGENTS.md` §5 的 F0–F3 矩阵执行，不因 v2、公开字段、`scripts/` 路径或多文件本身升级。先跑最靠近改动的测试、编译或生成检查；只有定向证据不能覆盖实际影响时才升级。

涉及受管控件、共享样式或内部策略时先运行 `npm run reuse:check`，再执行风险级别要求的检查。

完成条件：每个受影响契约都有通过的直接证据，复用检查达到“控件全部分类、无原始组合类、无未登记受保护值副本”，且没有运行高于所需级别的门禁；存在方案时记录实际命令与结果。

### 4. 交付

- 普通开发交付实现、测试、生成 Reference 与必要方案；知识库、公开 Wiki、CHANGELOG 和 `VERIFICATION.md` 留到发版准备。纯文档任务按目标即时处理。
- 任务完成后不自动提交；仅在用户明确要求时 commit，仅在明确要求时 push。
- 使用 Conventional Commits，一次提交对应一个需求点；如果几个需求任务逻辑相似，可以合并为一次提交；类型与格式见 `AGENTS.md`「Git 规范」（§7）。
- 合并代码时，把合并提交 / PR 标题改为 Conventional Commits 格式（见 `AGENTS.md`「Git 规范」§7），不保留默认的 `Merge branch ...` / `Merge pull request ...` 标题。
- 改动只提交在本仓库（stellar）；仅当用户明确要求时 push。
- 完成条件：改动已通过应执行的验证并保留在工作区；如用户要求提交，提交符合规范；如用户要求 push，已推送且远端为最新；如用户明确要求回复 issue 或标记为已解决，对应评论或标签操作已按 `docs/agents/issue-tracker.md` 完成。分别汇报代码就绪、已提交、已推送和 issue 状态。

### 5. 发版准备

- 仅在用户要求发版或明确要求文档维护时，按 `docs/guides/release-process.md` 完成净变化文档同步。
- 完成条件：每项最终净变化都有文档落点或 N/A 结论，知识库与公开 Wiki 的适用检查通过，Wiki commit 已推送。

### 6. 发版

- 由用户触发时执行：按最终净变化确定版本号 → 完成第 5 步 → 向用户确认版本号与变更摘要 → `npm run release:dry -- <version>` 预演 → 正式发版。
- 详见 `docs/guides/release-process.md` 与 `AGENTS.md`「发版规范」（§8）。
- 完成条件：版本号与变更摘要已获用户确认；dry-run 通过后完成正式发版。
