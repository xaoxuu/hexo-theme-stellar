# Issue 操作约定

主题任务的持久化记录位于 `xaoxuu/hexo-theme-stellar` GitHub Issues。方案正文维护目标、决策、影响范围、兼容边界和验收标准；评论追加实施状态、实际命令与结果。

## 读取与授权

- 用户提供 Issue 编号或链接时，读取正文和评论作为上下文；存在 Issue 本身不代表允许回写。
- 用户明确要求持久化方案、同步 Issue、回复或更改状态时，执行获准的写入；本任务已有授权持续有效，不在每个阶段重复确认。超出授权范围的写入先准备具体内容，再请求确认。
- 未获写入授权时，在对话中交付结论与必要的待同步内容；不因缺少 Issue 写入授权中断已获准的本地工作。

## 定位与记录

- 在主题仓库运行 `gh` 并用 `git remote -v` 核实所有者；跨仓库使用完整 Issue URL 或显式 `--repo owner/repo`。
- 读取使用 `gh issue view <number> --comments`；裸编号类型不明时查询 `gh pr view <number>`。查询失败先区分类型不符与网络/权限失败，确认 PR 后按 PR 请求处理。
- 获准持久化后，先查找同一任务的 Issue，存在则更新，缺失才创建。跨域设计、迁移、兼容取舍和发布计划需要保留时均使用此流程；本地规范与知识库按 AGENTS.md“文档”维护。
- 多行正文或评论写入临时 UTF-8 文件，用 `gh issue create --title <title> --body-file <file>`、`gh issue edit <number> --body-file <file>` 或 `gh issue comment <number> --body-file <file>`；发布后清理该临时文件。
- 需要维护 Blocking 关系时，优先使用 GitHub 原生 dependencies；`issue_id` 使用 blocker 的数据库 ID。不可用时在正文以完整 Issue 链接记录 `Blocked by`，只阻塞真正依赖该事项的工作。

## 完成 Issue

实现与验证完成后，按已获授权回复结果；获准标记已解决时添加 `resolved` 标签。该标签会触发 `.github/workflows/label-commenter.yml` 的自动回复与关闭，须将这些副作用计入授权范围。通过标签流程关闭，不另行手动关闭。提交代码本身不授权评论、打标签或关闭。
