---
title: 统一背景图观感：封面 / 轮播 / 页顶 banner / banner 标签通用覆盖层
date: 2026-08-16
status: 已通过
---

# 统一背景图观感：封面 / 轮播 / 页顶 banner / banner 标签通用覆盖层

## 1. 问题与目标

四类背景图组件的叠加观感不一致：

- 文章列表 poster 封面（`.post-card.post.photo .cover`）：文字边缘常驻「同图渐变模糊层 + 黑色渐变蒙版」，hover 时图片与模糊层同步放大 `scale(1.05)` 并整体变暗（`brightness(75%)`、`saturate(120%)`），是目标基准。
- 置顶轮播 post 幻灯片（`.pin-slide.post-slide`）：机制接近基准但参数不一致（放大 1.04、`brightness(.92)`、模糊高度等），wiki/项目幻灯片（`.pin-slide`）仍是静态渐变蒙版，无模糊层。
- 页顶 banner（`.article.banner`）：黑色蒙版常驻，但模糊层仅 hover 才淡入，hover 无放大/变暗。
- banner 标签（`.tag-plugin.banner`）：有 hover 放大/变暗，但无同图渐变模糊层与顶部黑色蒙版。

成功标准（可验收的行为）：

- 四处组件的文字区域（上、下或上下）常驻同图渐变模糊层 + 黑色渐变蒙版，观感与 poster 封面一致。
- hover 时背景图与模糊层同步缓慢放大（`scale(1.05)`，图片 1.5s、模糊层 0.5s 缓动），亮度降至 75%、饱和度升至 120%。
- 抽象为通用 Stylus mixin，四处复用；poster 封面仅重构、视觉不变。

## 2. 技术方案

### 2.1 新增通用能力

在 `source/css/_common/cover-overlay.styl` 新增 `cover-overlay($url-var, $sides, $img)` mixin（参考 `blur-effect()` 的写法）：

- `$url-var`：背景图 CSS 变量名（`--cover-url` / `--pin-cover-url` / `--bg-url`），模糊层取同图背景。
- `$sides`：文字方向 `top` / `bottom` / `both`。单侧用 `:before` 模糊层 + `:after` 黑色蒙版；双侧用 `:before`/`:after` 两个模糊层 + `.banner-mask-top/bottom` 蒙版元素（对齐页顶 banner 现有结构）。
- `$img`：需要 hover 放大的图片选择器（如 `img`、`.bg`、`.pin-slide-bg`）。
- 统一默认变量：`--img-br: 100%`、`--img-sat: 100%`、`--blur-px: 1em`、`--blur-height: 128px`、`--blur-sat: 120%`、`--cover-zoom: 1.05`；hover 规则统一为 `--img-br: 75%`、`--img-sat: 120%`、`--blur-sat: 200%`。
- 图片与模糊层过渡对齐基准：图片 `all .2s ease-out, transform 1.5s ease-out`，模糊层 `all .2s ease-out, transform .5s ease-out`（含 `-moz/-webkit/-o` 前缀，沿用现有写法）。
- 模糊层常驻 `transform: translateZ(0)`，hover 时叠加 `scale(var(--cover-zoom))`，保留 Safari 圆角裁剪规避机制。

### 2.2 接入四处组件

- `source/css/_components/list.styl`：`.post-card.post.photo .cover` 重构为调用 mixin（`$sides` 由 `position` 属性决定 top/bottom），视觉与参数不变。
- `source/css/_components/pin-slider.styl`：post 幻灯片参数对齐基准（放大 1.05、暗化改用 `--img-br/--img-sat/--blur-sat` 变量、过渡时长对齐）；wiki/项目幻灯片接入 bottom 覆盖层，用统一蒙版+模糊层替换静态 `.pin-slide-mask`，保留 chips/标题/摘要结构与 hover。
- `source/css/_components/partial/article-banner.styl`：`.article.banner .bg+.content` 模糊层由 hover 才显示改为常驻显示；hover 增加 `.bg` 图片与模糊层的放大 + 变暗；保留 `--text-banner`、`.banner-mask` 结构及 Safari 圆角兼容（`isolation: isolate`、`translateZ(0)`、`clip-path`）。
- `scripts/tags/lib/banner.js` + `source/css/_components/tag-plugins/banner.styl`：banner 标签容器注入内联 `--bg-url` 并补 `.banner-mask-top/bottom` 元素；接入双侧覆盖层，保留现有 hover 放大/变暗，过渡与缩放参数对齐基准。

## 3. 影响范围

- 对外行为：poster 封面（视觉不变）、置顶轮播（post/wiki 幻灯片）、页顶 banner（模糊层常驻 + hover 放大变暗）、banner 标签（新增模糊层与蒙版）的静止/hover 观感。
- 无新增配置项、无用户可见 API 变化；banner 标签渲染结构新增蒙版元素与内联 `--bg-url`（内部行为）。
- 需要同步的知识库页面：`docs/knowledge/03-内容系统/post-lists-cards.md`、`docs/knowledge/04-标签插件/link-grid-banner-tags.md`、`docs/knowledge/02-布局系统/logo-navigation-headers.md`、`docs/knowledge/知识库全量.md`，并在 `docs/knowledge/VERIFICATION.md` 登记。
- 主仓库侧同步 `source/wiki/stellar/` 相关页面（banner 标签、页面 banner 说明）。

## 4. 验证方式

- 主工程 `npm run g` 全量构建通过（`scripts/tags/lib/banner.js` 有改动，必做）。
- `npm run s` 预览：首页（post 轮播 + poster 封面 top/bottom）、wiki 列表页（wiki 轮播）、带 banner 的文章页/归档页、正文含 `{% banner %}` 的页面；核对静止态蒙版/模糊层常驻、hover 放大变暗、明暗主题、移动端圆角归零。
- `python3 docs/knowledge/tools/verify.py` 知识库硬事实核查。
