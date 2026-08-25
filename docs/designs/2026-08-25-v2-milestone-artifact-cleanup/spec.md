---
title: Stellar v2 里程碑产物清理
date: 2026-08-25
status: 已完成
---

# Stellar v2 里程碑产物清理

## 问题与目标

Alpha、Beta 只作为 Stellar v2 的内部成熟度里程碑，不会对应 npm 版本、Git tag、GitHub Release 或独立用户指南。当前根目录 `ALPHA.md`、公开 Reference 中的工程审计/性能证据，以及 `alpha:*` 验证命名会让本地候选包看起来像计划公开发布的预发布产品。

本切片删除这层错误公开承诺，同时保留本地 tarball 集成、首屏性能和配置边界审计的可执行证据。最终公开包只包含配置、模型与 Blueprint 契约；主题运行时、配置 Schema、CLI、URL 和渲染行为不变。

## 实施方案

- 删除 `ALPHA.md`，README 只说明 v2 尚未发布、生产环境继续使用 1.x。
- Reference 索引改为“开发中契约预览”，只公开配置、模型与 Blueprint/CLI Reference。
- 配置字段审计迁入 `docs/audits/2026-08-24-v2-config-field-audit.{json,md}`；性能基线迁入 `test/fixtures/performance-baseline.json`，两者继续由现有生成/检查入口维护，但不进入 npm tarball。
- 集成和性能命令、CI 文件、测试文件使用 `integration` / `performance` 中性命名；本地候选包仍可暂用 `2.0.0-alpha.1` 作为未发布 SemVer 字符。
- 发版入口与 npm workflow 可读取内部候选 SemVer，但只把稳定版或 RC 作为可发布目标；Alpha/Beta 里程碑不自动触发 npm publish、tag 或 GitHub Release，实际发布由维护者决定。
- 主工程总蓝图同步声明 Alpha/Beta 是内部里程碑，只有 `2.0.0` 执行公开发布。

## M10 内部验收接缝

运行环境固定为 Node.js 22、Hexo 8、npm 10+。M10 使用仓库源码生成的本地 tarball，不从 npm registry 安装 v2：

```bash
npm run integration:check
npm run performance:check
npm pack --dry-run --json
```

集成门禁在隔离临时工程覆盖无主题覆盖的默认站点和三套 Blueprint，执行 init、doctor、new note 与 generate，并检查四类内容 ViewModel、Runtime Manifest 和唯一 ESM 入口。人工验收继续按主工程总蓝图覆盖默认 Markdown、三种语言、主要路由、两条 v1 迁移旅程及桌面/移动端场景；本切片不提前完成 M10。

## 边界

- 不删除已完成的其它 `docs/designs/` 档案。
- 不发布 npm、不创建 tag、不创建 GitHub Release，不更新主仓库子模块指针。
- `source/wiki/stellar/`、迁移/SEO、公开 URL、CSS、语言文案和浏览器 API 变更均为 N/A。
