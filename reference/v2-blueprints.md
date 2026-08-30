# Stellar v2 Blueprint 与 CLI Reference

> 本页由 Blueprint/Visual Style manifest 与 CLI 契约自动生成。请勿手工编辑。

## 最小命令

```bash
npx hexo stellar init --blueprint classic --style card --non-interactive
npx hexo stellar doctor --format text
npx hexo generate
```

`init` 会在写入前展示完整计划并拒绝覆盖已有文件；生成结果不包含 Blueprint 锁文件或运行时继承。

## Blueprints

| ID | Name | Default style | Description | Generated files |
| --- | --- | --- | --- | --- |
| classic | Classic | card | 使用 Leftbar 设置入口的经典个人博客，适合持续发布文章、分类与标签内容。 | _config.stellar.yml<br>source/_posts/welcome-to-stellar.md |
| minimal-reading | Minimal Reading | minimal | 在 Topbar 展示设置入口的低干扰长文与随笔站点。 | _config.stellar.yml<br>source/_posts/a-quiet-place-to-write.md |
| docs-reference | Docs Reference | card | 使用 Topbar 导航与 Leftbar 设置入口的结构化 Wiki 文档站。 | _config.stellar.yml<br>source/_data/wiki.yml<br>source/_data/wiki/docs-reference.yml<br>source/wiki/docs-reference/index.md<br>source/wiki/docs-reference/getting-started.md |
| light-and-shadow | Light and Shadow | glass | 以 Glass 与 Topbar 设置入口营造沉浸式作品站。 | _config.stellar.yml<br>source/_posts/welcome-to-light-and-shadow.md |

## Visual Styles

| ID | Name | Description |
| --- | --- | --- |
| card | Card | 清晰的实体卡片、边界与层级。 |
| flat | Flat | 半透明平面、轻量模糊与清晰分隔线。 |
| glass | Glass | 半透明表面、柔和模糊与光影层次。 |
| minimal | Minimal | 以正文为中心的克制色彩、紧凑圆角与低动效。 |

## CLI contract

- init options: `--blueprint`、`--style`、`--dry-run`、`--non-interactive`
- doctor formats: `text`、`json`
- JSON 全局选项: `--silent`

## Manifest contract

- schema version: `1`
- sealed: `true`
- path: safe non-empty relative path
- unique targets: `true`
- physical containment: theme and site roots, including symlink resolution
