# 首页支持可配置评论区（默认关闭）

> 日期：2026-08-10 | 关联：主仓库 `docs/specs/home-comments/spec.md`

## 背景

首页布局（`layout/index.ejs`）只渲染文章列表与分页器，不执行 `_partial/comments/layout.ejs`，因此首页无法显示评论区。文章/页面可以通过 front-matter 覆盖评论参数（`comments`、`comments_service`、`comment_title`、`comment_id`、各服务参数），但首页没有 front-matter，缺少等价的配置入口。

## 方案

在主题配置的 `site_tree.home` 下新增 `comments` 项，默认关闭；开启后首页第一页复用现有评论组件渲染评论区，配置语义与页面 front-matter 覆盖一致：

- `false` / 留空：不显示（默认）。
- `true`：使用全局 `comments.service` 及其参数。
- 对象：按页面 front-matter 方式覆盖，支持 `service`、`comment_title`、`comment_id` 及 `beaudar`/`utterances`/`giscus`/`twikoo`/`waline`/`artalk` 各服务参数。

实现：

- `layout/index.ejs`：当 `is_home_first_page()` 且 `site_tree.home.comments` 非空/非 `false` 时，将配置映射到 `page` 字段（`comments=true`、`comments_service`、`comment_title`、`comment_id`、`page[服务名]`），并在分页器之后引入 `_partial/comments/layout`。
- `layout/_partial/comments/layout.ejs`：加载门禁由 `theme.comments.service` 改为 `cmt.service`（即 `page.comments_service || theme.comments.service`），使首页/页面在全局评论服务为空时也能通过配置的 `service` 覆盖启用评论；全局已配置服务的现有站点行为不变。

## 影响范围

| 文件 | 改动内容 |
|------|---------|
| `_config.yml` | `site_tree.home` 新增 `comments` 默认项与注释示例 |
| `layout/index.ejs` | 首页第一页按配置映射评论参数并渲染评论区 |
| `layout/_partial/comments/layout.ejs` | 加载门禁改为 `cmt.service` |
| `docs/designs/2026-08-10-home-comments.md` | 本设计文档 |

## 执行计划

1. 修改 `_config.yml`、`layout/index.ejs`、`layout/_partial/comments/layout.ejs`
2. 全量验证：`npm run g && npx gulp minify`
3. 核对生成结果：首页默认无评论、开启后首页第一页有评论且分页页无评论、对象覆盖生效
4. 提交主题仓库，更新主仓库子模块指针与 wiki/spec 文档（推送需用户确认）

## 测试记录

### 2026-08-10

- 全量验证：`npm run g`（hexo clean && generate && gulp minify）通过，无模板渲染错误或 HTML 结构错误。
- 默认关闭：首页 `index.html` 无 `id="comments"` 评论区，未加载评论脚本。
- 开启 `true`：首页 `index.html` 渲染 artalk 评论区；`/page/2/` 分页页无评论区。
- 对象覆盖 `{service: giscus}`：首页 `index.html` 渲染 giscus 评论区，服务参数来自全局 `comments.giscus`。
- 回归：文章/页面 `comments: false` 仍不渲染评论区；未配置评论服务的页面不显示评论。
