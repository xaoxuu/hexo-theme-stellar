# 发版流程

> 创建日期: 2026-08-08

## 概述

Stellar 发版分两步：脚本完成版本号更新和推送 → CI 自动化完成 npm 发布和 tag 创建。

```
npm-publish.sh → push main + npm → CI (.github/workflows/npm-publish.yml) → npm publish + git tag
```

## 前置条件

- 当前在 `main` 分支，且已同步最新代码
- 工作区无无关改动（仅允许 `_config.yml` 和 `package.json` 有未提交变更）

## 脚本功能

`npm-publish.sh` 负责：

1. 更新 `_config.yml` → `stellar.version`
2. 更新 `package.json` → `version`
3. 更新 `_config.yml` 中 CDN URL 的版本号（jsdelivr）
4. `git add _config.yml package.json` + commit（`release: {version}`）
5. push main 分支 → rebase npm 分支 → push npm 分支

## CI 自动化

push npm 分支后，[npm-publish.yml](../.github/workflows/npm-publish.yml) 自动触发：

- 检测 commit message 匹配 `^release:\ (.*)`，提取版本号
- 发布到 [npm](https://www.npmjs.com/package/hexo-theme-stellar)
- 创建 Git tag（如 `1.33.2`）

## 使用方式

```bash
# 正常发版（CI 自动处理 npm publish 和 tag）
bash npm-publish.sh 1.33.2

# 预览（仅显示变更，不提交/推送，执行后自动回滚）
bash npm-publish.sh 1.33.2 --dry-run
```

## 发版 Checklist

- [ ] 所有功能变更已合并到 main，且通过 `gulp minify` 验证
- [ ] 通过 `bash npm-publish.sh <version> --dry-run` 检查版本号变更
- [ ] 执行 `bash npm-publish.sh <version>` 推送
- [ ] 等待 CI 完成（GitHub Actions → npm-publish workflow）
- [ ] 验证 [GitHub Releases](https://github.com/xaoxuu/hexo-theme-stellar/releases) 有对应 tag
- [ ] 验证 [npm 页面](https://www.npmjs.com/package/hexo-theme-stellar) 版本已更新

## 版本号规范

- 格式: `x.y.z` 或 `x.y.z-rc.n`
- Tag 格式: 不带 `v` 前缀（如 `1.33.2`，非 `v1.33.2`）
- 仅 rc 测试版本和正式版本发布到 npm（CI 自动处理）
