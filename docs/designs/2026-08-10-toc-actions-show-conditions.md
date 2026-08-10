# TOC 操作按钮按目录/评论条件显示

> 日期：2026-08-10 | 关联：`docs/designs/2026-08-09-decouple-toc-actions.md`

## 背景

`2026-08-09` 的解耦改动让 toc 组件在无标题层级时仍渲染操作按钮（「回到顶部」「参与讨论」），但「参与讨论」的判定只看「主题配置了评论服务且页面未禁用评论」，与评论区是否实际渲染的口径不一致。

复现：作者页（`/author/`）使用 archive 布局，不执行 `_partial/comments/layout.ejs`，页面既没有目录也没有评论区，但 `#data-toc` 仍渲染了包含「回到顶部」「参与讨论」的 footer。

## 方案

以「评论区是否实际渲染」为准，统一 toc 组件操作按钮的显示条件：

- `_partial/comments/layout.ejs`：完成 `loadComment` 判定后写入 `page.cmt_rendered = loadComment`（与 `page.cmt` 同位置），作为「本页渲染了评论区」的标记。
- `_partial/widgets/toc.ejs` 的 `layoutDiv()`：
  - `hasToc`：目录体非空；
  - `hasComments`：`page.cmt_rendered === true`；
  - 两者均不满足 → 整个组件返回空字符串；
  - 有目录 → 渲染 header + body；任一条件满足 → 渲染 footer；
  - footer 内「回到顶部」在 footer 渲染时始终显示；「参与讨论」仅在 `hasComments` 时显示。

## 显示条件一览

| 部分 | 显示条件 |
|------|---------|
| 组件整体（`#data-toc`） | 有目录（`hasToc`）或有评论（`hasComments`） |
| header（本文目录 + 折叠按钮） | `hasToc` |
| body（目录列表） | `hasToc` |
| footer · 回到顶部 | `hasToc` 或 `hasComments` |
| footer · 参与讨论 | `hasComments`（页面实际渲染评论区，含 wiki 项目级 `comments: false` 覆盖） |

## 影响范围

| 文件 | 改动内容 |
|------|---------|
| `layout/_partial/comments/layout.ejs` | 渲染判定完成后写入 `page.cmt_rendered` |
| `layout/_partial/widgets/toc.ejs` | `layoutDiv()` 按 `hasToc` / `hasComments` 条件渲染 |
| `docs/designs/2026-08-10-toc-actions-show-conditions.md` | 本设计文档 |

## 执行计划

1. 修改 `layout/_partial/comments/layout.ejs`
2. 修改 `layout/_partial/widgets/toc.ejs`
3. 全量验证：`npm run g && npx gulp minify`
4. 核对生成结果：作者页、无目录笔记页、普通文章页、Wiki 页
5. 提交主题仓库，更新主仓库子模块指针（需用户确认）

## 测试记录

### 2026-08-10

- 全量验证：`npm run g`（hexo clean && generate && gulp minify）通过，204 个文件生成，HTML / CSS / JS 压缩无结构错误。
- `/author/xaoxuu`、`/author/anonymous`：不再输出 `#data-toc`。
- `notes/json`（无目录 + 评论）：`#data-toc` 仅渲染 footer，含「回到顶部」「参与讨论」。
- `blog/20250602`（有目录 + 评论）：header + body + footer 完整渲染。
- `wiki/stellar`（有目录 + 评论）：完整渲染，与改动前一致。
- 首页 / 标签 / 分类列表页：无 `#data-toc` 输出，不受影响。
