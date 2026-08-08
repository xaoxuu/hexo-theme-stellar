# emoji 标签支持直接引用外部图片

> 日期：2026-08-09 | 类型：新功能 | 关联 Issue：[#636](https://github.com/xaoxuu/hexo-theme-stellar/issues/636)

## 背景

emoji 标签目前只能从配置的表情包（`tag_plugins.emoji` 中配置的 source）取图：

```text
{% emoji [source] name [height:1.75em] %}
```

某些场景不需要引入一整套餐包，只想用某一张图片作为表情（例如 issue 中直接引用一张外链 PNG）。因此需要支持直接指定图片 URL。

## 方案

新增可选参数 `url:`，提供时直接渲染该图片，不再走配置的 source 查找：

```text
{% emoji url:https://example.com/emoji.png [name:alt 文本] [height:1.75em] %}
```

- `url`：图片地址（必填，使用 `url:` 前缀），支持任意 http(s) 外链
- `name`：可选，作为 `alt` 属性；`name:` 键形式与原有 `{% emoji [source] name %}` 的位置参数形式互不冲突
- `height`：沿用现有可选参数，输出内联 `style`

原有语法完全兼容，不带 `url` 时行为与现在一致。`url` 优先于 source/name 配置查找。

## 实现

修改 `scripts/tags/lib/emoji.js`：

1. `ctx.args.map(args, ['height'], ['source', 'name'])` 增加 `url`、`name` 两个键：`ctx.args.map(args, ['url', 'height', 'name'], ['source', 'name'])`
2. 解析后若 `args.url` 存在，直接输出 `<img src="url">`（可选 `alt`、`height`），否则走原有 source 配置逻辑
3. 更新文件头注释中的语法说明

不需要改动样式（复用 `.tag-plugin.emoji img` 现有规则），不涉及布局/JS/i18n。

## 影响范围

| 文件 | 改动 |
|------|------|
| `scripts/tags/lib/emoji.js` | 新增 `url:` 参数支持 |
| `docs/designs/2026-08-09-emoji-external-url.md` | 本设计文档 |

主仓库（xaoxuu.com）侧：

| 文件 | 改动 |
|------|------|
| `source/wiki/stellar/tag-plugins/express.md` | 文档补充 `url:` 用法 |

## 验证

- `npm run g && npx gulp minify` 全量构建通过
- 渲染用例：
  - `{% emoji url:https://.../003.png %}` → `<img src="https://.../003.png">`
  - `{% emoji url:https://.../003.png name:表情 height:2em %}` → 含 alt 与 height 样式
  - 原有 `{% emoji tieba huaji %}` 输出不变
  - 非法/无 source 时输出为空，与现状一致

### 测试记录

- [x] `npm run g && npx gulp minify` 通过（主工程全量构建）
- [x] 单元级用例：issue 示例 URL、`name`/`height`、带 `?color=` 的 URL、原有 source/name 语法均输出正确
- [x] 端到端渲染：临时文章内 `{% emoji url:... %}` 经 Hexo 生成后输出 `<span class="tag-plugin emoji"><img no-lazy class="inline" src="..."/></span>`，`name`/`height` 正确生效，原有语法输出不变

### 提交记录

- `hexo-theme-stellar`: `e64c773` feat: support external image url in emoji tag
- `hexo-theme-stellar-docs`: `3c8dbbc` docs: add url parameter usage for emoji tag
- `xaoxuu.com`: `e6d17d8` chore: update stellar theme and docs submodules
