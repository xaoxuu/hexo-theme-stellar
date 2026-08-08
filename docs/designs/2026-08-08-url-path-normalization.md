# URL 路径规范化统一

> 日期：2026-08-08 | 作者：xaoxuu | 版本：v1.35.0

## 背景

URL 路径处理逻辑分散在多处（`pretty_url` helper、`pretty_urls` filter、`generate_canonical`、`local-search.js`、`doc_tree`、`notebooks`、`merge_posts`），各自的规范化方式不一致：

| 位置 | 旧方式 | 问题 |
|------|--------|------|
| `pretty_url.js` | 正则替换 `.html` → `/` | 正确，但逻辑孤立 |
| `doc_tree.js` | `replace('.html', '')` | 只替换第一个 `.html`，有 bug |
| `notebooks.js` | `replace('.html', '')` + base_dir 去尾 `/` | 同上，且 base_dir 规则与 doc_tree 相反 |
| `merge_posts.js` | `replace('.html', '')` | 只替换第一个 `.html` |
| `head.ejs` canonical | `pretty_url()` 后又做 `.html` 检查 | 冗余逻辑，说明对 pretty_url 不信任 |
| `local-search.js` | 正则替换（客户端） | 逻辑重复 |

导致路径格式不统一（`/path`、`/path/`、`/path.html`、`/path/index.html` 共存），对 canonical URL 不友好。

## 方案

创建唯一的 `normalize_path()` 函数作为所有路径规范化的入口，定义唯一的「干净路径」格式（path_key），所有路径比较和输出都从它派生：

```
normalize_path(path) → path_key（用于匹配/比较，如 wiki/project/getting-started）
                              │
                       pretty_url(path) → 带尾斜杠的输出（如 /wiki/project/getting-started/）
```

### normalize_path 逻辑

1. 绝对 URL 直接返回
2. `/index.html` → `/`
3. `/index`（无后缀的目录首页）→ `/`
4. `.html` → 移除
5. 移除尾 `/`（保留根路径 `/`）

### pretty_url 逻辑

`normalize_path()` + 添加尾 `/`（根路径 `/` 除外）

## 改动清单

### 新增文件（1 个）

| 文件 | 说明 |
|------|------|
| `scripts/lib/path_utils.js` | 统一的 `normalize_path()` 函数 |

### 修改文件（6 个）

| 文件 | 改动内容 |
|------|---------|
| `scripts/helpers/pretty_url.js` | 从 `path_utils` 引入 `normalize_path`，注册为 EJS helper；`pretty_url()` 重构为复用 `normalize_path()` + 尾 `/` |
| `scripts/events/lib/doc_tree.js` | `path_key` 改用 `normalize_path()` |
| `scripts/events/lib/notebooks.js` | `path_key` 改用 `normalize_path()`；`base_dir` 统一以 `/` 结尾 |
| `scripts/events/lib/merge_posts.js` | `path_key` 改用 `normalize_path()` |
| `layout/_partial/head.ejs` | 移除 `generate_canonical()` 中冗余的 `.html` 检查 |
| `scripts/filters/pretty_urls.js` | 无需修改（已将 `.html` 转换为 `/index.html`，由 `normalize_path` 统一处理） |

## 修复的 Bug

1. `path_key` 使用 `replace('.html', '')` 只替换第一个 `.html`，若路径含多个 `.html` 会出错 → 改用正则 `/\.html$/`
2. `notebooks.js` 的 `base_dir` 移除尾 `/`，与 `doc_tree.js` 保留尾 `/` 相反 → 统一为保留尾 `/`
3. `generate_canonical()` 对 `pretty_url()` 不信任做了二次 `.html` 处理 → 移除冗余代码
4. 首页 `pretty_url('/')` 产生 `//`（因为 `normalize_path('/')` 返回 `/`，再加 `/` 变 `//`，而正则 `/([^:]\/)\/+/g` 无法匹配开头的 `//`）→ 添加根路径判断，`/` 不追加尾 `/`

## 验证

- `npm run g && npx gulp minify` 构建无报错
- 所有页面 canonical URL 以 `/` 结尾：
  - 首页：`https://xaoxuu.com/`
  - 文章页：`https://xaoxuu.com/blog/20260801/`
  - Wiki 页：`https://xaoxuu.com/wiki/stellar/`
  - 笔记页：`https://xaoxuu.com/notes/ios/`

## 后续修复（2026-08-09）

### 问题

上一版仅统一了输出层（`pretty_url`、`path_key`），但 `page.path` 本身仍保留 `.html` 后缀（如 `wiki/git/git-server.html`），导致：

- `page.permalink`（`full_url_for` + `pretty_urls.trailing_html=false`）去掉 `.html` 后不补尾斜杠，JSON-LD `url`/`@id` 与 sitemap `loc` 缺少尾斜杠，与 canonical 不一致（影响 34 个叶子页）；
- `search.json` 输出原始 `.html`/`index.html` 路径，未统一为干净路径。

### 方案

在 `generateBefore` 最早阶段直接改写 Page model 存储中的 `page.path`：对以 `.html` 结尾（非 `/index.html`）且 layout 非 false 的页面，将路径归一为目录形式（`xxx.html` → `xxx/`），使 permalink、JSON-LD、sitemap 自动与 canonical（尾斜杠格式）一致。该步骤先于 `doc_tree`/`notebooks` 存储 `path`，模板中的路径比较（侧栏高亮、wiki 封面、上下篇）保持一致。

`search.js` 生成器对输出路径统一使用 `normalize_path()`（`/xxx/index.html` → `/xxx/`），保证 search.json 无 `.html` 残留。

`json_ld` 首页分支将站点 URL 归一为带尾斜杠形式（`https://xaoxuu.com/`）。

客户端 `local-search.js` 的 `.html` 归一化逻辑保留，兼容旧版搜索缓存（`search_cache_v1`）。

### 验证

- `npm run g && npx gulp minify` 构建无报错，404.html 仍生成
- canonical：169/169 自引用且以 `/` 结尾
- JSON-LD 页面级 `url`/`@id` 与 canonical 一致；首页为 `https://xaoxuu.com/`
- page-sitemap.xml 全部 `loc` 以 `/` 结尾
- search.json 无 `.html` 路径（含目录首页的 `index.html`）
- 站内链接无 `.html` 残留
