---
title: 置顶文章封面宽高比与非置顶文章统一
date: 2026-08-12
status: 已实施
---

# 置顶文章封面宽高比与非置顶文章统一 方案

## 1. 问题与目标

置顶内容轮播（pin-slider）的文章幻灯片当前固定宽高比为 2:1，且独立维护比例，与非置顶文章卡片不统一。目标：置顶文章封面宽高比改为与非置顶文章一致（读取 `article.cover_ratio`，默认 2:1），并同步将幻灯片重构为固定「标题 + 一行小字」结构。

成功标准（可验收）：

- 置顶文章卡片不再复用非置顶文章卡片，文字区域为固定结构：一个标题 + 一行小字；
- 标题取值：`poster.headline` > `title`；小字取值：`poster.caption` > `description` > excerpt（截断 50 字）；
- 大/小标题样式与 poster 卡片 cover-info 一致（白色、文字阴影、同字号字重）；
- 文字区与 poster 卡片 cover-info 一致：同款渐变模糊层（同图模糊 + 底部渐变 mask）、底部渐变背景、同字号字重与四周间距（`padding: 1rem`）；
- 置顶文章没有封面时：卡片为纯白背景，标题/小字使用普通文章颜色；
- 置顶文章幻灯片整体宽高比与非置顶文章一致（`article.cover_ratio`，默认 2:1）；
- 轮播区宽高比与非置顶文章统一：直接读取 `article.cover_ratio`（默认 2），不再单独维护比例配置，修改一处即可整体调整。

## 2. 技术方案

- `layout/_partial/main/pin_slider.ejs` 的 `postSlide()`：不再调用 `post_card`，改为输出 `<a class="pin-slide post-slide">` + 封面图（`.pin-slide-bg`）+ 模糊层（`:before` 伪元素，同图模糊 + 底部渐变 mask）+ 文字区（`.pin-slide-text`，含 `.pin-slide-headline` 与 `.pin-slide-caption`）；
- 标题与文案取值：`poster.headline` > `title`；`poster.caption` > `description` > `strip_html(excerpt|content)` 截断 50 字（`truncate(text, {length: 50})`）；
- `.pin-slide.post-slide` 的 `aspect-ratio` 读取 `hexo-config('article.cover_ratio')`（与非置顶文章卡片一致）；文字区样式对齐 poster 卡片 `cover-info`（headline：`$fsh3` / 500 / 白字 + 文字阴影；caption：`$fs-14`、单行省略，移动端分别降为 `$fsh4` / `$fs-13`）；
- `source/css/_components/pin-slider.styl`：幻灯片新增 `.pin-slide` 模糊层 `::before`（与 poster `.cover:before` 相同：`--pin-cover-url` 同图模糊 `blur(1em)` + `linear-gradient(to top, …128px)` mask，z-index 1），文字区盒模型（`bottom: 0`、`padding: 1rem`、`width: 100%`、`box-sizing: border-box`、底部渐变背景，z-index 2）与 cover-info 的模糊层/底部渐变一致；四周间距统一为 `padding: 1rem`（`list.styl` 的 `.cover-info` 同步调整）；删除 `.post-card` / `.md-text` 等列表卡片复用样式；`no-cover` 时纯白底（`var(--card)`）、标题 `var(--text)`、小字 `var(--text-p2)`。

涉及文件：

- `_config.yml`（更新 `pin_slider` 注释：轮播区比例随 `article.cover_ratio`）
- `layout/_partial/main/pin_slider.ejs`（修改：统一 poster 封面样式）
- `source/css/_components/pin-slider.styl`（修改：统一读取配置、新增固定文字区样式、移除卡片复用样式）
- `source/css/_components/list.styl`（修改：`.cover-info` 的 padding 改为 `1rem`，与置顶文字区一致）
- `docs/designs/2026-08-12-pin-slider-cover-ratio/`（本方案）
- `docs/knowledge/VERIFICATION.md`（登记）
- `docs/knowledge/00-总览与安装配置/configuration.md`、`知识库全量.md`（配置说明）
- 主工程 `source/wiki/stellar/advanced-settings.md`（配置说明）

## 3. 影响范围

- 对外行为：置顶文章轮播横幅宽高比改为与非置顶文章一致（`article.cover_ratio`，默认 2:1），不再单独维护比例配置；
- 行为变化：置顶文章卡片不再复用非置顶文章卡片，文字区固定为「标题 + 一行小字」；无封面文章为纯白卡片；
- 兼容性：wiki/专栏幻灯片行为不变；`article.cover_ratio` 为既有配置，无兼容性问题；
- 需要同步的文档：`docs/knowledge/VERIFICATION.md` 新增记录；知识库现行页未写死 2:1 比例，无需其他改动。

## 4. 验证方式

- 主题仓库 `npm run check`（lint + 单测 + 知识库硬事实核查）；
- 主工程 `npm run g` 全量构建；
- 无头浏览器检查首页置顶轮播：与非置顶封面一致（2:1）、封面铺满、标题与小字样式正确；真实文章覆盖 `poster.headline`/`title` 与 `poster.caption`/`description`/excerpt 回退；
- 临时改 `article.cover_ratio` 验证「一处修改、列表与轮播整体生效」后还原。
