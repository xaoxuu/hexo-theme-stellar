# 发版流程

> 创建日期: 2026-08-08
> 更新日期: 2026-08-27（发布基线 + 净变化文档同步）

## 概述

Stellar 发版一键全自动：AI/人工提前准备 CHANGELOG 章节，Node 脚本校验非空并更新版本号后推送，CI 在 npm 分支推送后自动完成 npm 发布、tag 创建与 GitHub Release 创建。

Stellar v2 的 Alpha、Beta 只表示内部工程成熟度，不进入本流程，也不会自动修改 npm dist-tag、创建 Git tag 或 GitHub Release。发版脚本可以读取开发分支的内部候选 SemVer；稳定版或 RC 是否实际发布由维护者决定。

```
npm run release → push main + npm → CI 自动触发 → npm publish + git tag + GitHub Release
```

CHANGELOG.md 的历史数据已于 2026-08-09 一次性从 GitHub Releases API 同步入库（统一格式：二级标题为版本号，三级标题为分类）；此后每次发版的更新日志由 AI/人工提前写入 CHANGELOG.md，脚本只做非空校验。

开发提交维护实现、测试、生成 Reference 与必要方案；知识库、公开 Wiki、CHANGELOG 和 `VERIFICATION.md` 在发版准备时集中同步。发版审计比较两个最终文件树，不恢复已经被最终候选抵消的中间方案。

## 发布基线与净变化

使用 `AGENTS.md` §5 定义的**发布基线**与候选替换边界。

发版准备以发布基线和最终候选的树差异为输入：

1. 确认目标版本升级自哪个公开 tag；RC 延续已有 RC 时使用维护者确认的上一公开候选。
2. 比较发布基线树与最终候选树，核对最终 Schema、Reference、默认配置、CLI、生成输出、模板、样式、浏览器行为、语言和失败语义。
3. 逐项归纳用户可见行为、配置、API、迁移和兼容性的净变化。只存在于中间提交、在最终树中已经消失的行为不进入文档、CHANGELOG 或版本号判断。

完成条件：每项最终净变化均能指向当前实现与验证证据；兼容和迁移范围只覆盖发布基线及明确外部接缝。

## 文档准备

净变化确认后一次性完成：

1. 更新 `docs/knowledge/` 中受影响的发布事实，并在 `VERIFICATION.md` 增加一条版本级汇总；不为同一版本的每个开发任务分别登记。
2. 更新 `hexo-theme-stellar-docs` 公开 Wiki。正文遵守主工程 `$content-main`，核对字段名、默认值、示例、导航、目录与搜索。
3. 在 Wiki 仓库提交并推送文档 commit，但暂不更新 xaoxuu.com 的子模块指针，避免未发布功能提前上线。
4. 按最终净变化编写 CHANGELOG；升级注意只描述发布基线到目标版本的实际迁移。
5. 运行 `npm run knowledge:check` 及公开 Wiki 的适用检查，将主题知识库与 CHANGELOG 提交到主题仓库。

纯文档任务和事实纠错即时交付，不等待发版。Schema 生成 Reference、Contribution descriptor 的文档路径等机器契约继续随实现保持一致，不属于延迟同步范围。

完成条件：每项最终净变化均落到知识库、Wiki、CHANGELOG，或有明确的 N/A 结论；主题与 Wiki 工作树均只保留发版脚本允许的文件。

## 更新日志准备

每次发版前，由 AI 或人工按净变化在 `CHANGELOG.md` 中为待发布版本写入 `## <version>` 章节（H2 版本号 + H3 分类，如 `### 新功能` / `### 修复` / `### 升级注意（配置变更与破坏性改动）`）；章节末尾追加一行 `Full Changelog: [上一版本...当前版本](https://github.com/xaoxuu/hexo-theme-stellar/compare/上一版本...当前版本)`。脚本不生成内容，只在发版前校验该章节存在且非空，缺失或为空则终止。

## 前置条件

- 当前在 `main` 分支，且已同步最新代码
- 发布基线、最终净变化、知识库、公开 Wiki 与 CHANGELOG 已按上文核验；Wiki commit 已推送
- 工作区无无关改动（仅允许 `package.json`、`CHANGELOG.md` 有未提交变更，已暂存与未暂存都会检查）
- 本机 Node.js 可用（仓库要求 Node >= 22）

## 使用方式

```bash
# 交互式发版（提示输入版本号，提交前二次确认）
npm run release

# 显式指定版本号
npm run release -- 1.34.1

# 非交互环境发版（必须显式传版本号，并用 --yes 确认）
npm run release -- 1.34.1 --yes

# 预演（写入后自动恢复，不提交/推送）
npm run release:dry -- 1.34.1
```

## 脚本职责

根目录的 `release.js` 负责：

1. 校验版本号格式（`x.y.z` 或 `x.y.z-rc.n`）
2. 校验当前分支为 `main`、工作区无无关改动
3. 校验 CHANGELOG.md 已包含 `## <version>` 非空章节（内容由 AI/人工提前准备），缺失或为空则终止发版
4. 读取 `package.json` 的当前版本，在内存中同时准备 `package.json` 与安装知识库的目标版本内容；任一文件无法安全更新时不写入任何文件
5. 写入全部版本文件后执行 `npm run release:check`，让实现门禁与知识库核查基于最终待提交状态运行
6. 输出提交摘要与 diff，供人工确认；版本号与文档范围以发版前已经确认的树级净变化为准
7. 二次确认后将 CHANGELOG 与两个版本文件一并执行 `git add` / `commit` / `push`（main + npm 分支）
8. dry-run、取消或最终态质量检查失败时从内存恢复全部受管文件，不依赖 `git checkout --`

## CI 自动化

[npm-publish.yml](../.github/workflows/npm-publish.yml) 由 npm 分支推送自动触发（`push: branches: [npm]`），并保留手动触发（`workflow_dispatch`，默认 ref 为 npm）作为兜底：

- push 事件仅当 head commit message 以 `release: ` 开头时执行发布，否则跳过（防止误发布）
- 版本号来源为检出分支的 `package.json`
- 已发布版本自动跳过
- npm publish 使用 Trusted Publishing（OIDC + provenance）
- 发布成功后创建纯版本号 tag（如 `1.34.1`，无 `v` 前缀）
- 随后创建 GitHub Release：正文从 `CHANGELOG.md` 提取对应版本段落；版本含 `-rc.` 时标记 prerelease；release 已存在则跳过；提取为空时兜底使用 GitHub 自动生成 notes

## 失败处理

- dry-run 或二次确认取消：文件从内存恢复，工作区与执行前一致
- CHANGELOG 章节缺失或为空：脚本校验拦截并终止，提示先由 AI/人工补充该版本章节
- 安装知识库找不到当前包版本：写入前终止，不产生部分更新
- 最终态 `npm run release:check` 失败：恢复包版本、CHANGELOG 与安装知识库，修复后重新预演
- 版本已发布：CI 自动跳过 publish 与 tag，可安全重跑
- Release 已存在：CI 跳过创建，可安全重跑
- 推送失败（如 `npm` 分支漂移）：git 会报错并终止，已提交但未推送的改动可手动处理

## 发版 Checklist

- [ ] 所有功能变更已合并到 main，且通过构建验证
- [ ] 已确认发布基线及明确外部接缝，并完成发布基线树到最终候选树的净变化审计
- [ ] 知识库与版本级 `VERIFICATION.md` 已集中同步并通过 `npm run knowledge:check`
- [ ] 公开 Wiki 已按最终净变化同步，文档 commit 已推送但主站指针尚未更新
- [ ] 由 AI/人工在 CHANGELOG.md 中写入 `## <version>` 非空章节
- [ ] 执行 `npm run release:dry -- <version>` 检查变更与恢复
- [ ] 执行 `npm run release -- <version>`（或交互式 `npm run release`）推送
- [ ] 在 Actions 页确认 workflow 自动运行成功（npm publish + tag + GitHub Release）
- [ ] 验证 tag 已创建（无 `v` 前缀）
- [ ] 验证 GitHub Release 与正文（wiki「更新日志」页会自动展示）
- [ ] 验证 [npm 页面](https://www.npmjs.com/package/hexo-theme-stellar) 版本已更新
- [ ] 在 xaoxuu.com 更新并验证 `themes/stellar` 与 `source/wiki/stellar` 子模块指针，使主题与文档同时上线

## 版本号规范

- 格式: `x.y.z` 或 `x.y.z-rc.n`
- `alpha` / `beta` 不是可发布版本格式，只用于内部里程碑叙述
- Tag 格式: 不带 `v` 前缀（如 `1.34.1`，非 `v1.34.1`）
- 版本号由调用者显式传入，脚本不做自动推导
