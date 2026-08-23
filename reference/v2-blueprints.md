# Stellar v2 Blueprint 与 CLI Reference

> 本页由 Blueprint/Visual Style manifest 与 CLI 契约自动生成。请勿手工编辑。

## 最小命令

```bash
npx hexo stellar init --blueprint classic-blog --style stellar --non-interactive
npx hexo stellar doctor --format text
npx hexo generate
```

`init` 会在写入前展示完整计划并拒绝覆盖已有文件；生成结果不包含 Blueprint 锁文件或运行时继承。

## Blueprints

| ID | Name | Default style | Description | Generated files |
| --- | --- | --- | --- | --- |
| classic-blog | Classic Blog | stellar | 适合持续发布文章、分类与标签内容的经典个人博客。 | _config.stellar.yml<br>source/_posts/welcome-to-stellar.md |
| minimal-reading | Minimal Reading | minimal | 适合长文、随笔与低干扰阅读体验的内容站点。 | _config.stellar.yml<br>source/_posts/a-quiet-place-to-write.md |
| docs-reference | Docs Reference | stellar | 适合产品文档、项目手册与结构化知识库的 Wiki 站点。 | _config.stellar.yml<br>source/_data/wiki.yml<br>source/_data/wiki/docs-reference.yml<br>source/wiki/docs-reference/index.md<br>source/wiki/docs-reference/getting-started.md |

## Visual Styles

| ID | Name | Description |
| --- | --- | --- |
| stellar | Stellar | Stellar 的明快色彩、柔和表面与动态反馈。 |
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
