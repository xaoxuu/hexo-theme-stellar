# 发版流程

> 创建日期: 2026-08-08
> 最后更新: 2026-08-08（迁移到 release-please + OIDC Trusted Publishing）

## 概述

Stellar 使用 [release-please](https://github.com/googleapis/release-please) 自动化发版流程，分为两个阶段：

1. **release-please 自动阶段**：基于 conventional commits 自动确定版本号、生成 CHANGELOG、创建 Release PR
2. **手动发布阶段**：合并 PR 后手动触发 npm 发布（OIDC 认证，无需 token）

```
push main → release-please 创建 Release PR → 合并 PR → GitHub Release + tag → 手动触发 npm publish
```

## 原理

### 阶段一：release-please（自动）

- **触发条件**：push 到 `main` 分支
- **工作流**：[release-please.yml](../.github/workflows/release-please.yml)
- **行为**：
  1. 分析自上次发版以来的 conventional commits（`feat:` / `fix:` / `perf:` 等）
  2. 根据 [Semantic Versioning](https://semver.org/) 确定下一个版本号
  3. 创建 Release PR，包含：
     - `package.json` 版本号更新
     - `_config.yml` 中 `stellar.version` 同步更新
     - `CHANGELOG.md` 自动生成
     - `.release-please-manifest.json` 版本号更新
  4. 维护者 review 并合并 PR
  5. release-please 自动创建 GitHub Release + git tag

### 阶段二：npm 发布（手动）

- **触发条件**：手动 `workflow_dispatch`
- **工作流**：[npm-publish.yml](../.github/workflows/npm-publish.yml)
- **认证方式**：[npm Trusted Publishing (OIDC)](https://docs.npmjs.com/trusted-publishers)
  - GitHub Actions 通过 OIDC 向 npm 证明身份
  - 无需配置 `NPM_AUTH_TOKEN` secret
  - 自动生成 [provenance](https://docs.npmjs.com/generating-provenance-statements) 签名
- **行为**：执行 `npm publish --provenance --access public`

## 操作方式

### 日常开发

按 [Conventional Commits](https://www.conventionalcommits.org/) 规范提交代码：

```bash
git commit -m "feat: 添加新功能描述"
git commit -m "fix: 修复某问题"
git commit -m "perf: 优化某性能"
git commit -m "refactor: 重构某模块"
```

提交类型与版本号的关系：

| Commit 类型 | 版本号变化 | 示例 |
|------------|-----------|------|
| `fix:` / `perf:` | patch (`z+1`) | 1.33.1 → 1.33.2 |
| `feat:` | minor (`y+1`) | 1.33.1 → 1.34.0 |
| `feat!:` / `BREAKING CHANGE:` | major (`x+1`) | 1.33.1 → 2.0.0 |
| `refactor:` / `style:` / `docs:` | 不影响版本号 | — |

### push 后自动流程

```bash
# 日常 push 就会触发 release-please
git push origin main
```

push 到 main 后，release-please 会自动运行。如果检测到需要发版，会创建类似 `release-please--branches--main` 的 PR。

### Review 并合并 Release PR

1. 在 GitHub 上找到 release-please 创建的 PR
2. Review 变更内容（版本号、CHANGELOG 等）
3. 确认无误后合并 PR
4. 合并后 release-please 自动创建 GitHub Release + tag

### 发布到 npm

1. 前往 [Actions → npm-publish](https://github.com/xaoxuu/hexo-theme-stellar/actions/workflows/npm-publish.yml)
2. 点击 **Run workflow**
3. 选择分支（通常为 `main`），点击 **Run workflow**
4. 等待 job 完成

### 验证

- [GitHub Releases](https://github.com/xaoxuu/hexo-theme-stellar/releases) 有对应版本
- [npm 页面](https://www.npmjs.com/package/hexo-theme-stellar) 版本已更新

## 配置文件

| 文件 | 用途 |
|------|------|
| `release-please-config.json` | release-please 配置（发布类型、额外文件同步） |
| `.release-please-manifest.json` | 当前已发布的版本号（release-please 自动维护） |
| `.github/workflows/release-please.yml` | release-please 工作流定义 |
| `.github/workflows/npm-publish.yml` | npm 发布工作流定义（手动触发） |

## npm 侧配置

[npm Trusted Publishing](https://docs.npmjs.com/trusted-publishers) 需要在 npm 网站上配置一次（已配置）：

- 包页面 → Settings → Trusted Publisher → GitHub Actions
- Owner: `xaoxuu` | Repository: `hexo-theme-stellar` | Workflow: `npm-publish.yml`

## 兼容旧流程

如需手动发版（绕过 release-please），仍可使用 `npm-publish.sh`：

```bash
bash npm-publish.sh 1.33.2           # 手动发版
bash npm-publish.sh 1.33.2 --dry-run # 预览
```

但推荐使用新流程以获得自动 CHANGELOG 和更安全的发布体验。
