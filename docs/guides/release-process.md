# 发版流程

> 创建日期: 2026-08-08
> 更新日期: 2026-08-08（Node 化迁移后同步）

## 概述

Stellar 发版分两步：Node 脚本完成版本号更新和推送 → 手动触发 CI 完成 npm 发布和 tag 创建。

```
npm run release → push main + npm → 手动触发 npm-publish workflow → npm publish + git tag
```

## 前置条件

- 当前在 `main` 分支，且已同步最新代码
- 工作区无无关改动（仅允许 `_config.yml` 和 `package.json` 有未提交变更，已暂存与未暂存都会检查）
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

旧命令 `bash npm-publish.sh ...` 已移除，如需临时兜底可从 git 历史恢复。

## 脚本职责

根目录的 `release.js` 负责：

1. 校验版本号格式（`x.y.z` 或 `x.y.z-rc.n`）
2. 校验当前分支为 `main`、工作区无无关改动
3. 更新 `_config.yml` → `stellar.version`（保留单引号格式）
4. 更新 `package.json` → `version`
5. 输出变更摘要（自上一个 tag 以来的提交）与 diff，供人工确认
6. 二次确认后执行 `git add` / `commit` / `push`（main + npm 分支）
7. dry-run 或取消时从内存恢复文件，不依赖 `git checkout --`

## CI 自动化

[npm-publish.yml](../.github/workflows/npm-publish.yml) 为手动触发（`workflow_dispatch`），默认从 `npm` 分支发布：

- 版本号来源为检出分支的 `package.json`
- 已发布版本自动跳过
- npm publish 使用 Trusted Publishing（OIDC + provenance）
- 发布成功后创建纯版本号 tag（如 `1.34.1`，无 `v` 前缀）

## 失败处理

- dry-run 或二次确认取消：文件从内存恢复，工作区与执行前一致
- 版本已发布：CI 自动跳过，可安全重跑
- 推送失败（如 `npm` 分支漂移）：git 会报错并终止，已提交但未推送的改动可手动处理

## 发版 Checklist

- [ ] 所有功能变更已合并到 main，且通过构建验证
- [ ] 执行 `npm run release:dry -- <version>` 检查变更与恢复
- [ ] 执行 `npm run release -- <version>`（或交互式 `npm run release`）推送
- [ ] 手动触发 GitHub Actions → npm-publish workflow（默认 ref: npm）
- [ ] 验证 tag 已创建（无 `v` 前缀）
- [ ] 验证 [npm 页面](https://www.npmjs.com/package/hexo-theme-stellar) 版本已更新

## 版本号规范

- 格式: `x.y.z` 或 `x.y.z-rc.n`
- Tag 格式: 不带 `v` 前缀（如 `1.34.1`，非 `v1.34.1`）
- 版本号由调用者显式传入，脚本不做自动推导
