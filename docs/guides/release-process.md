# 发版流程

> 创建日期: 2026-08-08
> 更新日期: 2026-08-20（版本文件自动同步 + 最终态质量检查）

## 概述

Stellar 发版一键全自动：AI/人工提前准备 CHANGELOG 章节，Node 脚本校验非空并更新版本号后推送，CI 在 npm 分支推送后自动完成 npm 发布、tag 创建与 GitHub Release 创建。

```
npm run release → push main + npm → CI 自动触发 → npm publish + git tag + GitHub Release
```

CHANGELOG.md 的历史数据已于 2026-08-09 一次性从 GitHub Releases API 同步入库（统一格式：二级标题为版本号，三级标题为分类）；此后每次发版的更新日志由 AI/人工提前写入 CHANGELOG.md，脚本只做非空校验。

发版前还需完成**提交登记**：自上一 tag 起涉及主题代码/配置/行为变化的非合并提交（7 位短 SHA）登记到 `docs/knowledge/VERIFICATION.md`「提交登记（发版前核对）」表（`ci/check-release-docs.js` 校验，`npm run check` 内含该项，缺失会中止发版；纯文档 / CI / 工具改动无需登记）。

## 更新日志准备

每次发版前，由 AI 或人工在 `CHANGELOG.md` 中为待发布版本写入 `## <version>` 章节（H2 版本号 + H3 分类，如 `### 新功能` / `### 修复` / `### 升级注意（配置变更与破坏性改动）`）；章节末尾追加一行 `Full Changelog: [上一版本...当前版本](https://github.com/xaoxuu/hexo-theme-stellar/compare/上一版本...当前版本)`。脚本不生成内容，只在发版前校验该章节存在且非空，缺失或为空则终止。

## 前置条件

- 当前在 `main` 分支，且已同步最新代码
- 工作区无无关改动（仅允许 `_config.yml`、`package.json`、`CHANGELOG.md` 有未提交变更，已暂存与未暂存都会检查）
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
4. 读取 `package.json` 的当前版本，在内存中同时准备 `_config.yml`、`package.json` 与安装知识库的目标版本内容；任一文件无法安全更新时不写入任何文件
5. 写入全部版本文件后执行 `npm run check`，让 lint、单测、提交登记与知识库核查基于最终待提交状态运行
6. 输出变更摘要（自上一个 tag 以来的提交）与 diff，供人工确认
7. 二次确认后将 CHANGELOG 与三个版本文件一并执行 `git add` / `commit` / `push`（main + npm 分支）
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
- 安装知识库找不到当前包版本，或配置与包版本不一致：写入前终止，不产生部分更新
- 最终态 `npm run check` 失败：恢复配置、包版本、CHANGELOG 与安装知识库，修复后重新预演
- 提交登记缺失：`npm run check` 的提交登记完整性检查列出缺失短 SHA，补登记到 `docs/knowledge/VERIFICATION.md`「提交登记（发版前核对）」后重跑
- 版本已发布：CI 自动跳过 publish 与 tag，可安全重跑
- Release 已存在：CI 跳过创建，可安全重跑
- 推送失败（如 `npm` 分支漂移）：git 会报错并终止，已提交但未推送的改动可手动处理

## 发版 Checklist

- [ ] 所有功能变更已合并到 main，且通过构建验证
- [ ] 提交登记完整性：自上一 tag 起涉及主题代码/配置/行为变化的非合并提交已在 `docs/knowledge/VERIFICATION.md` 提交登记表登记短 SHA（`npm run check` 校验）
- [ ] 由 AI/人工在 CHANGELOG.md 中写入 `## <version>` 非空章节
- [ ] 执行 `npm run release:dry -- <version>` 检查变更与恢复
- [ ] 执行 `npm run release -- <version>`（或交互式 `npm run release`）推送
- [ ] 在 Actions 页确认 workflow 自动运行成功（npm publish + tag + GitHub Release）
- [ ] 验证 tag 已创建（无 `v` 前缀）
- [ ] 验证 GitHub Release 与正文（wiki「更新日志」页会自动展示）
- [ ] 验证 [npm 页面](https://www.npmjs.com/package/hexo-theme-stellar) 版本已更新

## 版本号规范

- 格式: `x.y.z` 或 `x.y.z-rc.n`
- Tag 格式: 不带 `v` 前缀（如 `1.34.1`，非 `v1.34.1`）
- 版本号由调用者显式传入，脚本不做自动推导
