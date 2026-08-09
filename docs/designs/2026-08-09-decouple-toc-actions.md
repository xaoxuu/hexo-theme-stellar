# 无目录时保留「回到顶部 / 参与讨论」操作按钮

> 日期：2026-08-09 | 关联 Issue：[#503](https://github.com/xaoxuu/hexo-theme-stellar/issues/503)

## 背景

toc 组件的定位是「与本文相关」：目录、回到顶部、参与讨论。但当前实现把三者绑死——`layout/_partial/widgets/toc.ejs` 中的 `layoutDiv()` 在页面没有标题层级时直接返回空字符串，导致「回到顶部」「参与讨论」按钮随目录一起消失。小笔记、随笔等没有标题结构的文章受影响。

「编辑本文」按钮此前已独立到文章底部（commit `b34cf83`），不在此次问题范围内。

## 方案

逻辑解耦，交互层面保持同一组件（符合 owner 在 issue 中表达的设计意图）：

- `layout/_partial/widgets/toc.ejs`：`layoutDiv()` 不再因 `tocBody` 为空整体返回空。无目录时只渲染 `widget-footer`（回到顶部 + 参与讨论）；有目录时才渲染头部（标题 + 折叠按钮）与目录体。
- 样式无需结构性改动：分割线 `.widget-body+.widget-footer:before` 仅在目录体存在时出现，footer-only 形态下组件显示为紧凑操作栏。
- `#data-toc` 相关浏览器 JS 对无 `.toc` 节点的场景已有空值保护（`scrollTOC` 判空返回、`activeTOC` 无匹配项时无操作），无需改动。

## 各部分显示条件

toc 组件整体及各部分的渲染条件如下（实现见 `layout/_partial/widgets/toc.ejs`）：

| 部分 | 显示条件 |
|------|---------|
| 组件整体（`#data-toc`） | 页面在 `rightbar` 中配置了 `toc` 组件（post / wiki / note / page 默认均配置） |
| header（本文目录 + 折叠按钮） | 页面内容存在标题层级（`toc(page.content)` 非空，且标题深度在 `min_depth` ~ `max_depth` 范围内） |
| body（目录列表） | 同 header，有标题层级时才渲染 |
| footer · 回到顶部 | 组件渲染时始终显示 |
| footer · 参与讨论 | 同时满足：`theme.comments.service` 已配置；本页未禁用评论（`page.comments != false`，含 wiki 项目级 `comments: false` 覆盖） |

无目录时组件只显示 footer 操作按钮（回到顶部，以及满足评论条件时的参与讨论），不再显示「本文目录」标题与折叠按钮。

## 影响范围

| 文件 | 改动内容 |
|------|---------|
| `layout/_partial/widgets/toc.ejs` | `layoutDiv()` 条件渲染调整：无目录体时仍渲染操作按钮 |
| `source/css/_components/widgets/toc.styl` | 更新过时注释（「编辑本文按钮」→「操作按钮」），无样式逻辑变化 |
| `docs/designs/2026-08-09-decouple-toc-actions.md` | 本设计文档 |

## 行为变化

所有在 `rightbar` 中配置了 `toc` 组件的内容页（post / wiki / note / page），即使没有标题层级，也会显示「回到顶部」按钮；启用了评论系统且页面未禁用评论时，同时显示「参与讨论」按钮。

## 执行计划

1. 修改 `layout/_partial/widgets/toc.ejs`
2. 更新 `source/css/_components/widgets/toc.styl` 注释
3. 全量验证：`npm run g && npx gulp minify`
4. 本地预览：无目录页面 + 普通文章页
5. 提交主题仓库，更新主仓库子模块指针

## 测试记录

### 2026-08-09

- 全量验证：`npm run g`（hexo clean && generate && gulp minify）通过，204 个文件生成，HTML / CSS / JS 压缩无结构错误。
- 无目录页面（`notes/json`、`notes/flutter`、`notes/mac`、`notes/ios`、`notes/webp`、`notes/index`）：`#data-toc` 仅渲染 `widget-footer`，包含「回到顶部」「参与讨论」，无 header / body。
- 有目录页面（`notes/server`、`blog/20250602`、`wiki/stellar`）：header（本文目录 + 折叠按钮）+ body（目录）+ footer（操作按钮）完整渲染，与改动前行为一致。
- 未配置 toc 组件的页面（如首页）不受影响，无 `#data-toc` 输出。
- `npx hexo server` 本地预览确认上述页面均正常输出。
