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

实现与验证完成后，评论结果并添加 `resolved` 标签。不要手动关闭 issue；仓库的 label-commenter CI 会负责关闭。

## v2 实施 issue 自动闭环

仅当 `$stellar-v2-program` 已把当前切片绑定到本仓库的实施 issue，且交付目标明确为 `v2` 分支时使用本流程。该条件同时构成提交、推送、交付评论与添加 `resolved` 标签的持续授权。

开始交付前确认：

- 当前分支为 `v2`，上游为 `origin/v2`。
- 当前 issue 范围可以和工作区中的其他修改清晰隔离。
- 主题开发 Skill 要求的实现、文档、状态记录、code review 与验证门禁全部通过。

按顺序完成闭环：

1. 只暂存当前 issue 的文件，以带 issue 号的 Conventional Commit 提交。
2. 推送到 `origin/v2`，确认远端 `v2` 已包含该提交。
3. 在 issue 评论用户结果、提交 SHA、验证命令与结果，以及适用项中的 `N/A` 理由。
4. 添加 `resolved` 标签，并确认 label-commenter CI 已将 issue 关闭。

任一前置条件或门禁未满足时，保留 issue 为 open，评论已经取得的证据、阻塞影响与下一责任方。CI 未能关闭时保留 `resolved` 标签并报告自动化失败，不以手动关闭替代。主仓库的提交、推送与子模块指针更新不属于本闭环。
