# Issue tracker：GitHub

本仓库的 issue 与执行 ticket 存放在 `xaoxuu/hexo-theme-stellar` GitHub Issues 中，所有操作使用 `gh` CLI。

## 约定

- 创建：`gh issue create --title "..." --body "..."`
- 读取：`gh issue view <number> --comments`
- 列出：使用 `gh issue list`，按需通过 `--label` 和 `--state` 筛选。
- 评论：`gh issue comment <number> --body "..."`
- 添加或移除标签：`gh issue edit <number> --add-label "..."` 或 `--remove-label "..."`
- 认领：`gh issue edit <number> --add-assignee @me`

仓库从 `git remote -v` 推断；在主题仓库目录运行时，`gh` 会自动识别。

## Pull request 是否作为 triage 请求入口

**PRs as a request surface: no.**

GitHub 的 issue 与 PR 共用编号空间。遇到裸编号 `#42` 时，先尝试 `gh pr view 42`，失败后再使用 `gh issue view 42`。

## 发布 ticket

当 skill 要求“发布到 issue tracker”时，创建一个 GitHub issue。

当前未安装 `triage` skill，因此 `/to-tickets` 不自动添加 `ready-for-agent` 标签；ticket 是否可执行由正文中的验收标准和 Blocking 关系确定。

## 设计方案与决策

跨域架构、迁移或兼容取舍、发布计划、需长期保留的产品决策，以及用户明确要求持久化的方案，统一记录在 GitHub issue 正文或评论中。仓库不创建单次设计目录或方案文件，也不为历史方案建立本地归档。

方案 issue 至少说明问题与目标、决策、影响范围、兼容边界和验收标准；实施中的结论变化继续更新同一 issue。创建、评论或修改 issue 属于外部写入，只有用户明确授权时执行。

## 读取 ticket

当 skill 要求“读取相关 ticket”时，运行：

`gh issue view <number> --comments`

## Blocking 关系

优先使用 GitHub 原生 issue dependencies：

- 获取 blocker 数据库 ID：
  `gh api repos/xaoxuu/hexo-theme-stellar/issues/<number> --jq .id`
- 添加阻塞关系：
  `gh api --method POST repos/xaoxuu/hexo-theme-stellar/issues/<child>/dependencies/blocked_by -F issue_id=<blocker-db-id>`

必须使用数据库 ID，不使用 issue 编号或 `node_id`。

如果原生 dependencies 不可用，在 ticket 正文顶部使用：

`Blocked by: #<number>, #<number>`

所有 blocker 关闭后，ticket 才进入执行 frontier。

## 完成 issue

实现与验证完成后，用户明确要求回复时评论结果；用户明确要求标记为已解决时添加 `resolved` 标签。不要手动关闭 issue；仓库的 label-commenter CI 会负责关闭。
