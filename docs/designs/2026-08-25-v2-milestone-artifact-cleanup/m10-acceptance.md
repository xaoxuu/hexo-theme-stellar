# M10 内部候选包验收资料

本文件承接原 Alpha 用户指南中仍有价值的环境、安装、初始化和人工验收步骤，只供 v2 M10 工程验收使用。它不是 npm 用户指南，也不表示 `2.0.0-alpha.1` 会被发布；Alpha、Beta 均只记录内部成熟度。

## 环境与候选包

- Node.js 22
- Hexo 8
- npm 10 或更高版本
- 从当前仓库生成的本地 tarball，不从 npm registry 安装 v2 Alpha/Beta

```bash
npm run integration:check
npm run performance:check
npm pack --dry-run --json
```

需要人工验收时，先在主题仓库执行 `npm pack` 得到本地 `.tgz`，再在已经执行过 `hexo init` 的临时空工程中安装该文件。不得把候选版本推送到 npm、修改 dist-tag、创建 Git tag 或 GitHub Release。

## 初始化与诊断

普通 Post/Page 可以不运行 `stellar init`、不创建 `_config.stellar.yml`，直接使用 Schema 默认值构建。需要完整 starter 时选择一套 Blueprint，并将站点 `_config.yml` 的 `theme` 设为 `stellar`：

```bash
npm install /absolute/path/to/hexo-theme-stellar-2.0.0-alpha.1.tgz
npx hexo stellar init --blueprint classic-blog --style stellar --non-interactive
npx hexo stellar doctor --format text
npx hexo generate
```

只查看初始化计划时使用：

```bash
npx hexo stellar init --blueprint docs-reference --style minimal --dry-run --non-interactive
```

需要机器可读诊断时使用 Hexo 全局 `--silent`，避免日志混入 JSON：

```bash
npx hexo stellar doctor --format json --silent
```

`init` 必须先列出全部目标文件；任一文件已经存在时整份计划都应被拒绝，不覆盖或合并用户内容。中途失败后不得留下部分生成文件。

## 验收矩阵

- Blueprint：`classic-blog`、`minimal-reading`、`docs-reference`，分别覆盖 `stellar` 与 `minimal` Visual Style。
- 默认输入：缺失 `_config.stellar.yml`、空配置、三种语言以及 Post/Page 最小 Front Matter。
- Collection：Wiki、Topic、Notebook 的唯一归属、零匹配、多重匹配和显式冲突。
- 命令：init 的 dry-run/真实计划一致；doctor 文本/JSON 诊断一致；new note 不覆盖文件；generate、Reference、Runtime Manifest 与搜索索引有效。
- 迁移：旁路 fixture 与原地 fixture 均由人工按 v1→v2 字段对照重建配置，不运行自动迁移器，不保留旧字段兼容读取。
- 页面：记录待测 URL，并在桌面端与移动端检查首页、文章、Wiki、Topic、Notebook、导航、搜索、评论降级与 SEO 输出。

每项人工验收记录环境、候选包哈希、执行命令、实际结果、预期差异、截图或日志位置和处理结论。自动门禁完成后状态只能进入“等待站长人工验收”；M10 与 Alpha 内部里程碑仍由站长明确确认。

## 契约入口

- [配置 Reference](../../../reference/v2-config.md)
- [模型 Reference](../../../reference/v2-models.md)
- [Blueprint 与 CLI Reference](../../../reference/v2-blueprints.md)
- [机器可读 Reference 索引](../../../reference/README.md)

v2 只接受 `site`、`seo`、`layout`、`content`、`appearance`、`resources`、`extensions`、`inject` 八个主题配置根。旧字段、未知字段和错误类型应由 doctor/build 按来源和字段路径拒绝；Runtime Manifest 与 Extension adapter 继续作为主题内部接缝。
