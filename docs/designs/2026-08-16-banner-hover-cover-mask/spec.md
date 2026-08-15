---
title: banner hover 动画对齐封面 + 渐变模糊层黑色蒙版
date: 2026-08-16
status: 已通过
---

# banner hover 动画对齐封面 + 渐变模糊层黑色蒙版

## 1. 问题与目标

- banner 标签（`.tag-plugin.banner`）hover 动画丢失：`trans1(transform, 2s)` 挂在容器上，而 `transform: scale(1.01)` 作用在 `img.bg`，transition 不生效，缩放为瞬时跳变且幅度极小。
- 文章列表 poster 卡片的同图模糊层（`.cover:before`）只靠 mask 控制模糊范围，缺少边缘压暗的黑色渐变，文字与背景对比不足。
- 成功标准（可验收的行为）：
  - `{% banner %}` hover 时背景图平滑放大至 1.05（1.5s 缓动），亮度降至 75%、饱和度升至 120%（0.2s 过渡），与文章列表 cover 一致。
  - poster 卡片、置顶轮播文章幻灯片、文章页 banner 的同款渐变模糊层增加黑色渐变蒙版：文字所在边缘不透明度约 0.5，垂直中线为 0。

## 2. 技术方案

- `source/css/_components/tag-plugins/banner.styl`：
  - 删除容器上的 `trans1(transform, 2s)`。
  - `.tag-plugin.banner` 定义 `--img-br: 100%`、`--img-sat: 100%`；`&:hover` 变为 `75%`、`120%`，`img.bg` `transform: scale(1.05)`。
  - `img.bg` 增加 `filter: brightness(var(--img-br)) saturate(var(--img-sat))` 与 `transition: all .2s ease-out, transform 1.5s ease-out`（含 `-moz/-webkit/-o` 前缀）；仅作用于 `.tag-plugin.banner img.bg`，不影响文章页 banner。
- `source/css/_components/list.styl`：
  - `.post-list .post-card.post.photo .cover` 新增 `:after` 黑色渐变蒙版：全幅、`pointer-events: none`、`z-index: 1`（模糊层 `:before` 之上、`.cover-info` z2 之下），不参与 hover 缩放。
  - `[position=top]`：`linear-gradient(rgba(0,0,0,0.5), rgba(0,0,0,0) 50%)`；`[position=bottom]`：`linear-gradient(rgba(0,0,0,0) 50%, rgba(0,0,0,0.5))`。
  - 移除 `.cover-info` 原有 0.2 边缘渐变背景，避免叠加后边缘总不透明度超过 0.5。
- `source/css/_components/pin-slider.styl`：
  - `.pin-slide.post-slide:not(.no-cover)::after` 加同款底部蒙版（文字固定在下），移除 `.pin-slide-text` 原有 0.2 底部渐变背景。
- `layout/_partial/main/navbar/article_banner.ejs` + `source/css/_components/partial/article-banner.styl`：
  - 模板在 `.bg+.content` 内、`${top}` 之前插入两个空 div（`banner-mask top/bottom`，`aria-hidden="true"`），仅 `banner.url` 存在时输出。
  - `.banner-mask`：`position: absolute; inset: 0; z-index: 1; pointer-events: none; opacity: var(--blur-opacity); trans1 all`，top/bottom 渐变同 poster 卡片；`.bg+.content` 增加 `position: relative`；蒙版与模糊层一致仅在 hover 时淡入。

## 3. 影响范围

- 对外行为：banner 标签、文章列表 poster 卡片、置顶轮播文章幻灯片、文章页 banner 的 hover 视觉。
- 无新增配置项、无 API 变化；CSS 兼容性沿用现有 `mask`/`filter` 方案（同图模糊层既有实现）。
- 需要同步的知识库页面：`docs/knowledge/03-内容系统/post-lists-cards.md`、`docs/knowledge/05-前端交互/client-side-overview.md`、`docs/knowledge/04-标签插件/link-grid-banner-tags.md`、`docs/knowledge/知识库全量.md`，并在 `docs/knowledge/VERIFICATION.md` 登记。
- 主仓库侧同步 `source/wiki/stellar/advanced-settings.md`（同图模糊层与轮播文字区说明）。

## 4. 验证方式

- 主工程 `npm run g` 全量构建通过（捕获 EJS 模板错误）。
- `npm run s` 预览：首页 poster 卡片（top/bottom 两种 position）、置顶轮播、文章页 banner hover、含 `{% banner %}` 页面 hover。
- `python3 docs/knowledge/tools/verify.py` 知识库硬事实核查。
