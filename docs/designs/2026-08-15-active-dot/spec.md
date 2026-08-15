---
title: Wiki 激活指示改为 menubar 同款小圆点
date: 2026-08-15
status: 已实施
---

# 激活指示小圆点 方案

## 1. 问题与目标

- 问题：wiki 切换页面时左侧树在激活项附近抖动、闪烁。根因是激活书签 `default:bookmark.active` 走异步图标加载：服务端输出空占位符 `<svg class="icon" data-icon="default:bookmark.active">`（`.post-list` 内 CSS 尺寸 1.5rem），由 `/js/icons.js` 在首绘后拉取 `js/icons/default.json` 原位替换为真实 SVG（`class="active-icon"`，尺寸 1rem）。替换瞬间激活行高度收缩约 3px，树内后续条目整体位移；图标又延迟出现，表现为激活栏附近闪烁。
- 成功标准：wiki 左侧树、右侧相关文章、链接列表的激活项不再依赖异步图标；切换页面无抖动/闪烁；无 JS 时激活指示仍显示；每页减少约 1KB 书签 SVG 传输。

## 2. 技术方案

- 模板：`layout/_partial/widgets/tree.ejs`、`related.ejs`、`components/link.ejs` 三处 `icon('default:bookmark.active')` 替换为 `<span class="active-dot"></span>`（仅激活项渲染）。
- 样式：`source/css/_components/widgets/list.styl`（tree/related）与 `widgets/components.styl`（linklist）新增 `.active-dot`，声明与 `sidebar/menu.styl` 的 `.active-dot` 一致：`flex-shrink: 0; width: 8px; height: 8px; border-radius: 50%; background: x-theme-gradient()`。tree/related 链接已用 `justify-content: space-between` + `gap: 16px`，圆点自然靠右、间距与旧图标一致，链接布局无需改动。
- 保留 `_data/icons.yml` 的 `default:bookmark.active` 与 `.active-icon` CSS 钩子（图标仍可被自定义模板/站点使用，属既有公开能力，不做清理）。

## 3. 影响范围

- 对外行为：激活指示由「书签 SVG（异步注入）」变为「纯 CSS 小圆点」，样式与 menubar 一致（8px 主题渐变圆点）；无 JS 时指示仍显示。
- 兼容性：`icon()` 行为、`icons.js`、首屏内联图标均不变；仅移除 3 个模板调用点的占位符引用。
- 需要同步：`docs/knowledge/VERIFICATION.md` 登记；主工程 `source/wiki/stellar/sidebar.md`「激活项右侧书签图标」描述改为「激活小圆点」。

## 4. 验证方式

- 主题仓库 `npm run check`（lint + 单测 + 知识库核查）；知识库改动后 `python3 docs/knowledge/tools/verify.py`。
- 主工程 `npm run g` 全量构建确认模板渲染无错误。
- 视觉验收：`npm run s` 检查 wiki 左侧树切换无抖动/闪烁；右侧相关文章、链接列表激活指示一致；无 JS 时圆点正常显示。
