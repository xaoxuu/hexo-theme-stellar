---
title: 背景图 URL 渲染修复方案
date: 2026-08-25
status: 已实施
---

# 背景图 URL 渲染修复方案

## 1. 问题与目标

`appearance.backgrounds.sidebar.image` 与 `appearance.backgrounds.page.image` 已收敛为原始 URL 字符串，但 Stylus 消费方仍手工拼接带引号的 `url()`。`hexo-config()` 返回的字符串本身带 Stylus 字符串语义，最终生成 `url(''https://…'')`，浏览器丢弃背景图；侧栏只剩深浅模式遮罩，表现为纯白或纯黑。

成功标准：原始 URL 配置生成有效 `background-image: url(...)`，侧栏 glass、遮罩、模糊和透明度行为保持不变，页面背景的同类隐患一并修复。

## 2. 技术方案

- 在 `source/css/_components/sidebar/sidebar.styl` 与 `source/css/_components/main.styl` 中使用 Stylus 原生 `url($image)`，不再手工拼接引号。
- 通过真实 `hexo-renderer-stylus` 编译 `source/css/main.styl`，以生成 CSS 作为回归测试 seam；测试同时覆盖 sidebar/page 原始 URL，并拒绝双重引号输出。
- 复用现有 `$leftbar-background-image`、`$site-background-image` 与公开配置，不新增设计令牌、mixin 或配置字段。

## 3. 影响范围

- 对外行为：恢复已声明的背景图渲染；无新增或变更配置。
- 兼容性：`appearance.backgrounds.*.image` 继续填写原始 URL，不接受旧式 `url(...)` 包装。
- 文档：现有知识库行为契约正确，仅在 `docs/knowledge/VERIFICATION.md` 登记偏差修正；公开 Wiki 无需调整。

## 4. 验证方式

- 回归测试先红后绿，断言 sidebar/page URL 均被编译为有效 CSS。
- 运行 `npm run check` 与主工程 `npm run g`。
- 检查生成 CSS 无 `url(''` / `url(\"\"`，首页、文章页与 Wiki 页仍使用 `data-ui-surface="glass"`。
