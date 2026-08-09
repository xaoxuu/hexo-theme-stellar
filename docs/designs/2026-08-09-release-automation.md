# 发版全自动化方案（npm 自动发布 + CHANGELOG 非空校验 + GitHub Release）

> 日期：2026-08-09
> 范围：发版链路自动化
> 状态：已实施（2026-08-09）

## 1. 背景

2026-08-08 Node 化发版后，流程仍有两个手动环节：

1. 推送后需手动触发 npm-publish workflow。
2. 每次发版需手动整理更新日志并在 GitHub 手动创建 Release。

## 2. 目标

1. npm 分支推送 `release:` 提交后，CI 自动完成 npm publish、tag 创建与 GitHub Release 创建。
2. CHANGELOG.md 历史数据一次性从 GitHub Releases API 同步入库，统一 H2 版本号 / H3 分类格式；脚本不承担历史同步。
3. 每次发版的更新日志由 AI/人工提前准备，脚本只做非空校验。
4. 保留 `workflow_dispatch` 手动兜底与「已发布版本跳过」幂等保护。

## 3. 方案

### 3.1 release.js（CHANGELOG 非空校验）

- `CHANGELOG.md` 纳入允许变更文件集合（备份/恢复、diff、提交均包含）。
- CHANGELOG.md 历史数据已于 2026-08-09 一次性从 GitHub Releases API 同步入库（76 个版本，统一 H2 版本号 / H3 分类格式），脚本不再负责历史同步。
- 更新日志内容由 AI/人工在发版前写入 `## <version>` 章节，脚本不生成内容。
- 提交前校验 CHANGELOG.md 已包含该版本的非空章节（`## <version>`），缺失或为空则终止；AI 执行时可先写好章节再调用脚本。

### 3.2 npm-publish.yml

- 触发：`push: branches: [npm]` + 保留 `workflow_dispatch`（默认 ref `npm`）。
- push 事件仅当 head commit message 以 `release: ` 开头才继续发布。
- checkout ref：`${{ inputs.ref || github.sha }}`。
- npm publish / tag 后创建 GitHub Release：
  - 正文从 `CHANGELOG.md` 提取 `## <version>` 段落
  - `-rc.` 版本标记 prerelease
  - release 已存在跳过；提取为空时兜底 `--generate-notes`

## 4. 影响范围

1. `release.js`
2. `.github/workflows/npm-publish.yml`
3. `docs/guides/release-process.md`
4. `CLAUDE.md`

## 5. 验收标准

1. 历史数据已一次性同步入库（2026-08-09，76 个版本）；dry-run 后文件恢复。
2. `release: <version>` 提交推送 npm 分支后，CI 自动完成 publish、tag、GitHub Release。
3. 非 `release:` 提交推送 npm 分支时跳过发布。
4. 已发布版本 / 已存在 Release 重跑时幂等跳过。
5. 提交前校验：CHANGELOG.md 缺少或为空该版本章节时脚本拦截；内容由 AI/人工提前准备。
6. 文档与实现一致，无残留「手动触发 / 手动创建 Release」主流程描述。

## 6. 变更记录

### 2026-08-09：修复 GitHub Release 创建失败

1.37.0 首次自动发版时，npm publish 与 git tag 均成功，但 `gh release create` 报
`To use GitHub CLI in a GitHub Actions workflow, set the GH_TOKEN environment variable`，
导致 GitHub Release 未创建。原因是 workflow 的 gh 调用步骤未注入 token。

- 修复：在 `npm-publish` job 增加 `env.GH_TOKEN: ${{ github.token }}`（配合已有
  `permissions.contents: write`），`gh release view` 与 `gh release create` 均可正常鉴权。
- 幂等重跑：已发布的版本与已存在的 tag 会自动跳过，仅补建缺失的 GitHub Release。

### 2026-08-09：Release 正文不再包含发布日期行

- 调整「Extract release notes from CHANGELOG.md」的 awk 提取逻辑，跳过
  `> 发布日期：` 行，Release 正文只保留分类与变更条目。
