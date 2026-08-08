# 发版脚本 Node 化更换计划

> 日期：2026-08-08
> 范围：发版链路整体整理
> 结论：采用 `Node + workflow 收敛` 方案
> 状态：已实施（2026-08-08）

## 1. 背景

当前发版流程由本地脚本 `npm-publish.sh` 与 GitHub Actions `npm-publish.yml` 共同完成：

```text
npm-publish.sh -> 更新版本号 -> git commit/push -> 手动触发 workflow -> npm publish + tag
```

现状已经可以工作，但存在以下问题：

1. Shell 脚本依赖 `sed -i ""` 等平台相关行为，可移植性差。
2. 本地脚本、CI workflow、文档三处规则分散，容易产生流程漂移。
3. dry-run 回滚依赖 `git checkout --`，对已有未提交改动的容错较弱。
4. 入口不统一，当前使用方式是 `bash npm-publish.sh <version>`，不符合 Node 项目常见习惯。
5. 文档中对 workflow 触发方式的描述与当前实现已有偏差，维护成本上升。

## 2. 目标

1. 将本地发版脚本从 Bash 更换为 Node 实现，消除平台兼容问题。
2. 将发版规则收敛到单一实现，减少本地脚本、CI 与文档之间的不一致。
3. 为仓库提供标准化命令入口，统一为 `npm run` 调用方式。
4. 保留交互式使用体验：不传版本号时可进入交互流程，并在正式执行前进行二次确认。
5. 保留现有发版语义：更新版本、提交、推送、发布 npm、创建 tag。
6. 为 dry-run、校验失败、重复发布等场景提供明确反馈和可回滚行为。

## 3. 非目标

1. 不调整 npm 包名、发布权限模型或 provenance 策略。
2. 不引入新的发布平台、release 管理系统或 changeset 工具链（历史曾尝试 release-please 后回退，本方案不重试）。
3. 不扩展自动推导版本号逻辑，版本号仍由调用者明确传入。
4. 不改造为多包 monorepo 发版模型。

## 4. 推荐方案

采用 `Node + workflow 收敛` 方案：

1. 使用一个 Node CLI 脚本统一处理本地发版准备动作，放在主题仓库根目录（`release.js`）。
2. 通过 `package.json` 暴露正式发布与 dry-run 命令入口。
3. GitHub Actions 保留 npm 发布和 tag 创建职责，但与 Node 脚本使用一致的版本来源和约束。
4. 发版文档同步改写为单一流程描述，避免脚本、CI、文档各自维护一套规则。

推荐原因：

1. 当前仓库本身就是 Node 项目，引入 Node CLI 没有额外运行时成本。
2. 文件读写、参数解析、错误处理、回滚逻辑都更适合在 Node 中实现。
3. 能够在不引入额外工具链的前提下显著提升稳定性和可维护性。

## 5. 目标流程

```text
npm run release -- <version>
  -> Node 脚本校验参数与工作区
  -> 更新 _config.yml 与 package.json
  -> 输出变更摘要（自上一个 tag 以来的提交）
  -> 二次确认是否继续
  -> git add/commit/push
  -> 推送 main 与 npm 分支
  -> 手动触发 GitHub Actions，并默认从 npm 分支发布
  -> GitHub Actions 校验是否已发布
  -> npm publish
  -> 创建并推送 tag
```

无参数交互流程：

```text
npm run release
  -> 检测为交互终端
  -> 提示输入版本号
  -> 校验版本号格式
  -> 更新 _config.yml 与 package.json
  -> 输出变更摘要与 diff
  -> 二次确认是否继续
  -> 确认后执行 git add/commit/push
  -> 后续进入既定 CI 发布流程
```

非交互流程：

```text
npm run release -- <version> --yes
  -> 必须显式传版本号，且显式传 --yes 确认
  -> 其余与正式流程一致
```

dry-run 流程：

```text
npm run release:dry -- <version>
  -> 执行所有校验和文件改写
  -> 输出变更摘要与 diff
  -> 恢复文件原始内容
  -> 不执行 commit/push/publish/tag
```

## 6. 设计说明

### 6.1 Node CLI

新增脚本路径为主题仓库根目录 `release.js`。

> 不放在 `scripts/` 目录：主题的 `scripts/` 是 Hexo 运行时插件目录，会被所有使用该主题的站点在构建时加载执行，不适合放 CLI 脚本。

职责边界：

1. 解析 CLI 参数：版本号、`--dry-run`、`--yes`、`--help`。
2. 未传版本号且处于交互终端时，提示输入版本号。
3. 校验版本号格式：支持 `x.y.z` 与 `x.y.z-rc.n`。
4. 校验当前分支、工作区状态（已暂存与未暂存均检查）、必要文件存在性。
5. 读取并更新 `_config.yml`（`stellar.version`，保留单引号格式）与 `package.json`。
6. 输出变更摘要（来源：`git log` 自上一个 tag）与 diff，便于人工确认。
7. 正式模式下在 commit/push 前执行二次确认；非交互环境必须显式传 `--yes`。
8. 正式模式下执行 `git add`、`git commit`、`git push`（main 与 `main:npm`）。
9. dry-run 模式下恢复文件内容，而不是依赖 `git checkout --`；写文件失败时也从内存备份恢复。

实现约束：

1. 使用 Node 内置模块优先，不额外引入发布框架。
2. 保持脚本逻辑单文件或少量辅助函数，避免过度工程化。
3. 错误信息使用明确中文提示，方便手工执行时判断原因。
4. 若处于非交互环境且未传版本号，则直接失败并提示必须显式传参。
5. 二次确认默认使用保守策略，只有明确输入确认值（`y`/`yes`）时才继续执行。

### 6.2 命令入口

在主题仓库 `package.json` 中增加统一命令入口：

```json
{
  "scripts": {
    "release": "node release.js",
    "release:dry": "node release.js --dry-run"
  }
}
```

约定：

1. 交互式正式发版：`npm run release`
2. 显式发版：`npm run release -- 1.34.1`
3. 非交互发版：`npm run release -- 1.34.1 --yes`
4. 预演模式：`npm run release:dry -- 1.34.1`

兼容策略：

1. `npm-publish.sh` 直接删除（可从 git 历史恢复作为临时兜底），不再保留转发层。
2. 文档主入口切换为 Node。

### 6.3 Workflow 收敛

现状核对（2026-08-08）：`npm-publish.yml` 已完成大部分收敛，本方案不改动其行为，仅将文档与其对齐：

1. `workflow_dispatch` 手动触发，默认 `ref` 为 `npm`。
2. 版本来源为当前检出 `package.json`。
3. 保留"已发布版本跳过"保护逻辑。
4. tag 命名为纯版本号，不加 `v` 前缀。
5. npm publish 使用 Trusted Publishing（OIDC + provenance）。

本次计划明确选择：

1. 本阶段不切换为自动触发，继续保留手动触发方式。
2. 本阶段不取消 `npm` 分支，而是先统一脚本、CI 与文档描述。
3. 后续如要改成自动触发，应另开新方案，不混入本次更换。

### 6.4 文档同步

以下文档需要同步更新：

1. `docs/guides/release-process.md`（注意：实际路径在 guides 子目录下）
2. `CLAUDE.md` 中的发版规范与 AI 调用指南
3. 如 README 中包含发版说明，也需同步修正

同步重点：

1. 命令入口从 `bash npm-publish.sh` 改为 `npm run release`
2. 明确 dry-run 命令与非交互 `--yes` 约定
3. 明确 workflow 触发方式为手动触发，默认发布来源为 `npm` 分支
4. 明确 tag 规则、版本号规则、失败回滚规则

## 7. 影响范围

1. `release.js`（新增，主题仓库根目录）
2. `package.json`（主题仓库，新增 release scripts）
3. `npm-publish.sh`（删除，迁移记录见 git 历史）
4. `.github/workflows/npm-publish.yml`（核对后无需改动，仅文档对齐）
5. `docs/guides/release-process.md`
6. `CLAUDE.md`

## 8. 风险与处理

### 8.1 流程切换风险

风险：本地入口变化后，维护者仍按旧命令执行。

处理：文档以 Node 入口为主；`npm-publish.sh` 已删除，可从 git 历史恢复。

### 8.2 工作区保护不足

风险：发版前仓库有未提交改动，可能导致错误覆盖或回滚异常。

处理：Node 脚本做精确文件白名单检查（`_config.yml`、`package.json`），同时覆盖已暂存与未暂存改动；dry-run 使用内存中的原始内容恢复，而不是直接依赖 `git checkout`。

### 8.3 CI 与本地规则再次漂移

风险：本地脚本和 workflow 各自演进，后续再次不一致。

处理：文档中明确"本地负责准备，CI 负责发布"的职责边界；版本来源、tag 规则、跳过已发布版本逻辑全部文档化。

### 8.4 交互模式与自动化环境冲突

风险：在 CI、远程脚本或无 TTY 环境中误用无参数命令，流程会卡住或行为不明确。

处理：仅在检测到交互终端时启用输入提示与二次确认；非交互环境必须显式传入版本号，并显式传 `--yes` 确认，否则快速失败并提示正确命令。

## 9. 验收标准

1. `npm run release` 在交互终端中可以提示输入版本号，并在正式提交前执行二次确认。
2. `npm run release:dry -- <version>` 可以在本地成功预演，并在结束后恢复文件。
3. `npm run release -- <version>` 可以完成版本更新、commit 与 push。
4. 非交互环境不传 `--yes` 时拒绝执行。
5. CI 可以从约定来源完成 npm 发布和 tag 创建。
6. 已发布版本再次执行时，CI 能安全跳过。
7. 文档中的发版命令、手动触发方式、默认 `npm` 分支来源、tag 规则与实际实现一致。

## 10. 执行计划

### 第 1 步：梳理当前规则

1. 对齐 `npm-publish.sh`、`npm-publish.yml`、`docs/guides/release-process.md`、`CLAUDE.md` 的现有规则。
2. 固化 workflow 继续使用手动触发，默认从 `npm` 分支发布。

交付物：一份规则对照清单（本方案文档的现状核对部分）。

### 第 2 步：实现 Node CLI

1. 新增根目录 `release.js`。
2. 实现参数解析、版本校验、文件更新、工作区检查、dry-run 恢复、git 调用。
3. 输出清晰的执行日志和失败提示。

交付物：可直接执行的 Node 发版脚本。

### 第 3 步：接入命令入口

1. 更新主题仓库 `package.json` 的 scripts。
2. 删除 `npm-publish.sh`。

交付物：统一的 `npm run release` / `release:dry` 入口。

### 第 4 步：核对 workflow

1. 核对 `.github/workflows/npm-publish.yml` 与文档一致性（手动触发、默认 `ref=npm`、版本来源、跳过规则、tag 规则）。
2. 行为已满足要求时不做改动。

交付物：与本地脚本一致的 CI 发布行为（文档对齐）。

### 第 5 步：更新文档

1. 更新 `docs/guides/release-process.md`。
2. 更新 `CLAUDE.md`。
3. 如有必要补充 README 中的维护说明。

交付物：与实现一致的发布文档。

### 第 6 步：验证与归档

1. `node --check release.js` 语法校验。
2. 执行 dry-run 验证变更与恢复逻辑。
3. 验证交互流程（提示、取消恢复）与非交互失败路径。
4. 记录测试结果到 `docs/`。

交付物：测试记录、最终可执行的发版链路。

> 注：本次改动不涉及主题 `scripts/` 运行时代码，无需执行 `npm run g && npx gulp minify`（该命令属于使用方博客仓库，主题仓库无此脚本）。

## 11. 测试计划

测试覆盖以下场景：

1. 交互终端下无参数执行，能够提示输入版本号。
2. 输入合法正式版本号：`1.34.1`。
3. 输入合法预发布版本号：`1.34.1-rc.1`。
4. 输入非法版本号时正确拦截。
5. 二次确认拒绝后不执行 commit/push，且文件恢复。
6. 非交互环境下无参数执行时快速失败。
7. 非交互环境下缺 `--yes` 时快速失败。
8. 非 `main` 分支执行。
9. 存在未提交无关改动（含已暂存）。
10. dry-run 后文件正确恢复。
11. CI 中检测到版本已发布时正确跳过。
12. tag 创建成功且命名正确。

## 12. 回滚策略

如本次更换出现问题，按以下顺序回滚：

1. 旧 `npm-publish.sh` 已删除，可从 git 历史恢复作为临时兜底入口。
2. 回退 `package.json` 中新增的 release scripts。
3. 回退 workflow 变更，恢复原发布路径（本方案未改动 workflow，回滚成本低）。
4. 保留文档中的迁移记录，避免重复踩坑。

## 13. 成功标志

当维护者不再依赖平台相关 Bash 行为，且可以通过统一的 `npm run release` 命令稳定完成本地准备与 CI 发布，同时文档与 workflow 描述保持一致，即本次更换计划达成目标。
