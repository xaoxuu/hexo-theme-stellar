# Stellar v2 Alpha

Stellar v2 Alpha 用于验证新的严格配置契约、四类内容模型、Blueprint/CLI 和 ESM Extension 运行时。它不兼容 v1 配置，也不承诺 Alpha 之间所有构建期契约保持不变；生产站点请继续使用 1.x 稳定版。

## 环境

- Node.js 22
- Hexo 8
- npm 10 或更高版本

## 安装与初始化

在一个已经执行过 `hexo init` 的空工程中安装预发布包，然后选择一套 Blueprint：

```bash
npm install hexo-theme-stellar@2.0.0-alpha.1
npx hexo stellar init --blueprint classic-blog --style stellar --non-interactive
npx hexo stellar doctor --format text
npx hexo generate
```

将 `_config.yml` 的 `theme` 设为 `stellar`。`init` 会先列出全部目标文件，任一文件已经存在时整份计划都会被拒绝，不会覆盖或合并现有内容。只查看计划时使用：

```bash
npx hexo stellar init --blueprint docs-reference --style minimal --dry-run --non-interactive
```

需要机器可读诊断时使用 Hexo 全局 `--silent`，避免日志混入 JSON：

```bash
npx hexo stellar doctor --format json --silent
```

## Blueprint 与 Visual Style

- `classic-blog` + `stellar`：文章、分类与标签优先的经典博客。
- `minimal-reading` + `minimal`：低干扰的长文阅读站点。
- `docs-reference` + `stellar`：带 Wiki 树与 Reference 入口的项目文档站点。

三套 Blueprint 都可以显式选择 `stellar` 或 `minimal`。生成结果是普通 `_config.stellar.yml`、Collection YAML 和 Markdown，归站点所有；主题不会写锁文件，也不会在运行时继承 Blueprint。

## 严格配置

v2 只接受八个主题配置根：`site`、`seo`、`layout`、`content`、`appearance`、`resources`、`extensions`、`inject`。Collection 与 Front Matter 同样使用 v2 字段；旧字段、未知字段和错误类型会在构建早期按文件和字段路径报错。

- [配置 Reference](reference/v2-config.md)
- [模型 Reference](reference/v2-models.md)
- [Blueprint 与 CLI Reference](reference/v2-blueprints.md)
- [机器可读 Reference 索引](reference/README.md)

## Alpha 中仍不稳定

- Theme、Collection 与 Front Matter Schema 在 Alpha 反馈后仍可能修正。
- `stellar init` / `stellar doctor` 的命令输出和错误组织仍可能加固。
- `CollectionModel`、`ContentItemModel`、`PageViewModel` 是构建期契约，不是浏览器公共 API。
- Runtime Manifest、Extension adapter 和 `stellar:*` 诊断事件是主题内部接缝，不承诺跨大版本兼容。
- 性能、真实站点兼容边界和第三方 provider 组合仍需 Alpha 系列验证。

## 尚未交付

完整 v2 产品首页、学习路径、三套真实公开 Demo、v1 文档冻结归档、人工迁移对照、旧 URL 重定向、sitemap/robots 集成与完整 Community 文档属于 Beta 或后续阶段。本 Alpha 不提供 v1 字段别名、自动迁移器、静默 fallback 或运行时兼容层。
