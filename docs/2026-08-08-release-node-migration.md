# 发版脚本 Node 化更换计划

> 日期：2026-08-08
> 范围：发版链路整体整理
> 结论：采用 `Node + workflow 收敛` 方案

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

本次更换计划的目标：

1. 将本地发版脚本从 Bash 更换为 Node 实现，消除平台兼容问题。
2. 将发版规则收敛到单一实现，减少本地脚本、CI 与文档之间的不一致。
3. 为仓库提供标准化命令入口，统一为 `npm run` 调用方式。
4. 保留现有发版语义：更新版本、提交、推送、发布 npm、创建 tag。
5. 为 dry-run、校验失败、重复发布等场景提供明确反馈和可回滚行为。

## 3. 非目标

本次不包含以下事项：

1. 不调整 npm 包名、发布权限模型或 provenance 策略。
2. 不引入新的发布平台、release 管理系统或 changeset 工具链。
3. 不扩展自动推导版本号逻辑，版本号仍由调用者明确传入。
4. 不改造为多包 monorepo 发版模型。

## 4. 推荐方案

采用 `Node + workflow 收敛` 方案：

1. 使用一个 Node CLI 脚本统一处理本地发版准备动作。
2. 通过 `package.json` 暴露正式发布与 dry-run 命令入口。
3. GitHub Actions 保留 npm 发布和 tag 创建职责，但与 Node 脚本使用一致的版本来源和约束。
4. 发版文档同步改写为单一流程描述，避免脚本、CI、文档各自维护一套规则。

推荐原因：

1. 当前仓库本身就是 Node 项目，引入 Node CLI 没有额外运行时成本。
2. 文件读写、参数解析、错误处理、回滚逻辑都更适合在 Node 中实现。
3. 能够在不引入额外工具链的前提下显著提升稳定性和可维护性。

## 5. 目标流程

更换完成后的目标流程如下：

```text
npm run release -- <version>
  -> Node 脚本校验参数与工作区
  -> 更新 _config.yml 与 package.json
  -> 生成变更摘要
  -> git add/commit/push
  -> 推送 main 与 npm 分支
  -> 手动触发 GitHub Actions，并默认从 npm 分支发布
  -> GitHub Actions 校验是否已发布
  -> npm publish
  -> 创建并推送 tag
```

dry-run 流程：

```text
npm run release:dry -- <version>
  -> 执行所有校验和文件改写
  -> 输出 diff 摘要
  -> 恢复文件原始内容
  -> 不执行 commit/push/publish/tag
```

## 6. 设计说明

### 6.1 Node CLI

新增一个 Node 脚本，建议路径：

```text
scripts/release.js
```

职责边界：

1. 解析 CLI 参数：版本号、`--dry-run`。
2. 校验版本号格式：支持 `x.y.z` 与 `x.y.z-rc.n`。
3. 校验当前分支、工作区状态、必要文件存在性。
4. 读取并更新 `_config.yml` 与 `package.json`。
5. 输出变更摘要，便于人工确认。
6. 正式模式下执行 `git add`、`git commit`、`git push`。
7. dry-run 模式下恢复文件内容，而不是依赖 `git checkout --`。

实现约束：

1. 使用 Node 内置模块优先，不额外引入发布框架。
2. 保持脚本逻辑单文件或少量辅助函数，避免过度工程化。
3. 错误信息使用明确中文提示，方便手工执行时判断原因。

### 6.2 命令入口

在 `package.json` 中增加统一命令入口：

```json
{
  "scripts": {
    "release": "node scripts/release.js",
    "release:dry": "node scripts/release.js --dry-run"
  }
}
```

约定：

1. 正式发版：`npm run release -- 1.34.1`
2. 预演模式：`npm run release:dry -- 1.34.1`

兼容策略：

1. 可以短期保留 `npm-publish.sh`，但文档主入口切换为 Node。
2. 若保留旧脚本，则旧脚本仅做兼容转发，不再承载核心逻辑。

### 6.3 Workflow 收敛

`npm-publish.yml` 保留 CI 发布职责，但需要与本地脚本收敛规则：

1. workflow 继续采用 `workflow_dispatch` 手动触发，并与文档保持一致。
2. 明确版本来源仅来自当前检出的 `package.json`。
3. 保留“已发布版本跳过”的保护逻辑。
4. 保留 tag 创建逻辑，但需要明确 tag 命名仍为纯版本号，不加 `v` 前缀。
5. 本地 Node 脚本继续推送 `main:npm`，workflow 默认 `ref` 保持为 `npm`。

本次计划明确选择：

1. 本阶段不切换为自动触发，继续保留手动触发方式。
2. 本阶段不取消 `npm` 分支，而是先统一脚本、CI 与文档描述。
3. 后续如要改成自动触发，应另开新方案，不混入本次更换。

### 6.4 文档同步

以下文档需要同步更新：

1. `docs/release-process.md`
2. `CLAUDE.md` 中的发版规范与 AI 调用指南
3. 如 README 中包含发版说明，也需同步修正

同步重点：

1. 命令入口从 `bash npm-publish.sh` 改为 `npm run release`
2. 明确 dry-run 命令
3. 明确 workflow 触发方式为手动触发，默认发布来源为 `npm` 分支
4. 明确 tag 规则、版本号规则、失败回滚规则

## 7. 影响范围

本次变更预计涉及以下文件：

1. `scripts/release.js` 或等效新文件
2. `package.json`
3. `npm-publish.sh`（删除、保留兼容层，或改为薄包装）
4. `.github/workflows/npm-publish.yml`
5. `docs/release-process.md`
6. `CLAUDE.md`

## 8. 风险与处理

### 8.1 流程切换风险

风险：

1. 本地入口变化后，维护者仍按旧命令执行。

处理：

1. 在文档中以 Node 入口为主。
2. 若保留旧脚本，则输出弃用提示并转发到 Node 实现。

### 8.2 工作区保护不足

风险：

1. 发版前仓库有未提交改动，可能导致错误覆盖或回滚异常。

处理：

1. Node 脚本做精确文件白名单检查。
2. dry-run 使用内存中的原始内容恢复，而不是直接依赖 git checkout。

### 8.3 CI 与本地规则再次漂移

风险：

1. 本地脚本和 workflow 各自演进，后续再次不一致。

处理：

1. 文档中明确“本地负责准备，CI 负责发布”的职责边界。
2. 版本来源、tag 规则、跳过已发布版本逻辑全部文档化。

## 9. 验收标准

满足以下条件即认为更换完成：

1. `npm run release:dry -- <version>` 可以在本地成功预演，并在结束后恢复文件。
2. `npm run release -- <version>` 可以完成版本更新、commit 与 push。
3. CI 可以从约定来源完成 npm 发布和 tag 创建。
4. 已发布版本再次执行时，CI 能安全跳过。
5. 文档中的发版命令、手动触发方式、默认 `npm` 分支来源、tag 规则与实际实现一致。

## 10. 执行计划

### 第 1 步：梳理当前规则

1. 对齐 `npm-publish.sh`、`npm-publish.yml`、`docs/release-process.md`、`CLAUDE.md` 的现有规则。
2. 固化 workflow 继续使用手动触发，默认从 `npm` 分支发布。

交付物：

1. 一份规则对照清单。

### 第 2 步：实现 Node CLI

1. 新增 `scripts/release.js`
2. 实现参数解析、版本校验、文件更新、工作区检查、dry-run 恢复、git 调用
3. 输出清晰的执行日志和失败提示

交付物：

1. 可直接执行的 Node 发版脚本。

### 第 3 步：接入命令入口

1. 更新 `package.json` 的 scripts
2. 视兼容策略决定是否保留 `npm-publish.sh`

交付物：

1. 统一的 `npm run release` / `release:dry` 入口。

### 第 4 步：收敛 workflow

1. 调整 `.github/workflows/npm-publish.yml`
2. 明确手动触发方式、默认 `ref=npm`、版本来源、跳过规则、tag 规则

交付物：

1. 与本地脚本一致的 CI 发布行为。

### 第 5 步：更新文档

1. 更新 `docs/release-process.md`
2. 更新 `CLAUDE.md`
3. 如有必要补充 README 中的维护说明

交付物：

1. 与实现一致的发布文档。

### 第 6 步：验证与归档

1. 执行 dry-run 验证变更与恢复逻辑
2. 进行一次正式演练或受控发布验证
3. 记录测试结果到 `docs/`

交付物：

1. 测试记录
2. 最终可执行的发版链路

## 11. 测试计划

测试覆盖以下场景：

1. 合法正式版本号：`1.34.1`
2. 合法预发布版本号：`1.34.1-rc.1`
3. 非法版本号输入
4. 非 `main` 分支执行
5. 存在未提交无关改动
6. dry-run 后文件正确恢复
7. CI 中检测到版本已发布时正确跳过
8. tag 创建成功且命名正确

如果本次改动涉及 `scripts/` 目录，则按仓库规范执行：

```bash
npm run g && npx gulp minify
```

必要时补充：

```bash
npm run s
```

## 12. 回滚策略

如本次更换出现问题，按以下顺序回滚：

1. 保留旧 `npm-publish.sh` 作为临时兜底入口。
2. 回退 `package.json` 中新增的 release scripts。
3. 回退 workflow 变更，恢复原发布路径。
4. 保留文档中的迁移记录，避免重复踩坑。

## 13. 成功标志

当维护者不再依赖平台相关 Bash 行为，且可以通过统一的 `npm run release` 命令稳定完成本地准备与 CI 发布，同时文档与 workflow 描述保持一致，即本次更换计划达成目标。
