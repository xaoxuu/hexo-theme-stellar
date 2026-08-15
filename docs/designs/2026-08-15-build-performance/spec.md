---
title: 主题构建性能优化（generate 阶段脚本重构）
date: 2026-08-15
status: 已实施
---

# 主题构建性能优化 方案

## 1. 问题与目标

- 主工程（xaoxuu.com）`npm run g` 全流程约 9–10s：`hexo clean` ~0.5s + `hexo generate` ~3.0s + `gulp minify` ~5.5s（html 5.2 / js 3.9 / css 1.7，并行）。
- `hexo generate` 阶段 CPU profile 按包归因（2026-08-15 实测，120 篇 md / 8121 行）：

  | 包 / 模块 | 占比 | 说明 |
  |-----------|------|------|
  | core/node | ~24% | 模块加载、YAML 等一次性开销 |
  | hexo-autonofollow | ~19% | 每页 cheerio 整页解析 + 序列化（主仓库依赖，不在本次范围） |
  | stylus | ~18% | 主题 CSS 编译（一次性） |
  | themes/stellar | ~9% | 主题模板渲染 + 构建期脚本（本次优化对象） |
  | hexo 内核 | ~8% | EJS partial / 渲染框架 |
  | highlight.js / marked | ~6.5% | 内容代码高亮与 Markdown 分词 |

- 主题脚本中存在多处**重复遍历与无条件全量处理**：`doc_tree` 对 wiki 页面反复 `filter`/`some`（O(W·P)），项目内 sections 组装再按 path_key 反复 `filter`（O(S·K·P)）；`notebooks` 每个笔记本全量 `filter` 全部页面（O(NB·P)）；`md_table` 对每篇文章无条件 cheerio 全量 parse + serialize；`img_lazyload`/`img_onerror` 对无图页面也跑正则；`search` 的 skip 正则逐 post 重编译。
- 成功标准：输出与旧实现**逐字节一致**（受控站点验证）；主题脚本复杂度由 O(N·M) 降为 O(N+M)；本站 generate 耗时不劣化；`npm run check` 全绿。

## 2. 技术方案

只改 `scripts/` 下构建期脚本，不动 gulpfile（主仓库与主题 CI 两份）、不动主仓库依赖/配置、不新增 npm 依赖、不新增配置项。

### doc_tree（`scripts/events/lib/doc_tree.js` → 抽取纯函数 `scripts/lib/doc_tree.js`）

- 一次遍历把 wiki 页面按 `wiki` 分组为 `Map<string, WikiPage[]>`，`wiki_list` 改按现有 tree 键序过滤有页面的项目（O(W+P) 替代 `some` 判定）。
- 每个项目内按 `path_key` 分组为 `Map<string, WikiPage[]>`（同一 path_key 可能对应多个页面，必须存数组），首页解析与 sections 组装改走索引查询，`others` 用已分配 path_key 的 `Set` 排除。
- `all_tags`/`relatedItems` 用 `Set`/`Map` 去重，并**保留旧实现的边界行为**：项目 id 恰等于标签名时 `items.includes(tag_name)` 的去重语义（用 `itemsSet.has(tag_name)` 等价复现）；tree 键序、sections 顺序、跨 section 重复 path_key 的重复输出、`others.sort((p1,p2)=>p1.title-p2.title)`、`page_number` 赋值顺序均不变。
- 事件入口瘦身为 `buildWikiTree({data, pages, shelf, siteTree})` 调用，`ctx.theme.config.wiki` 输出结构不变。

### notebooks（`scripts/events/lib/notebooks.js` → 抽取纯函数 `scripts/lib/notebooks.js`）

- `getNotebooksObject` 单遍 `groupPagesByNotebook` 分组页面（O(NB+P)），`prepareNotebook` 改为接收预分组数组；标签树、`noteMap` 构建与元素顺序不变。

### 内容过滤器短路

- `md_table.js`：`wrapMdTables` 在内容不含 `<table` 时原样返回（跳过 cheerio 全量 parse+serialize；本站 120 篇中仅 3 篇含表）。
- `img_lazyload.js` / `img_onerror.js`：`after_render:html` 前先 `/<img/i` 预检，无图页面（如 404）直接返回；两过滤器保持独立注册，不合并。

### 生成器 / 辅助函数小优化

- `generators/search.js`：`skip_search` 通配正则提到循环外编译一次，匹配语义不变。
- `helpers/related_posts.js`：删除 `listItem` 中未使用的 `posts.filter(...)` 死代码（该全量遍历结果无任何后续引用；`related_posts.enable` 默认 false，属休眠路径清理）。

## 3. 影响范围

- 对外行为：无。无公共 API / 配置 / 模板输出变更；仅执行路径与复杂度变化。
- 兼容性：全部改动保持 ES 语法兼容（`scripts/` 为 Node 22+ CommonJS）；不引入新依赖。
- 需要同步的知识库：`docs/knowledge/09-高级主题/performance.md`（补构建期性能分析与优化说明），并登记 `docs/knowledge/VERIFICATION.md`。

## 4. 验证方式

- 单测：`test/doc_tree.test.js`（新增，含旧算法参照实现的等价性用例 + 输出语义断言）、`test/notebooks.test.js`（新增，分组等价性）、`test/md_table.test.js`（增补无 table 短路用例）。
- 主题 `npm run check`（lint + 单测 + 依赖声明 + 知识库硬事实核查）。
- 受控微型站点：`/tmp/hexo-verify/site`（1 个 wiki 项目含 tree/sections/未收录页、带表格/不带表格/带图片的帖子、普通页面），同一份站点分别挂「旧代码主题副本」与「新代码主题副本」构建，两次同版本构建先验证确定性，再做旧 vs 新字节级 diff。
- 主工程 `npm run g` 全量构建（含 gulp minify），记录 generate 耗时与页面类型覆盖。
