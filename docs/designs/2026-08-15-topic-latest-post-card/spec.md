---
title: 专栏列表最新文章卡片与公共文章列表组件
date: 2026-08-15
status: 已实施
---

# 专栏列表最新文章卡片与公共文章列表组件 方案

## 1. 问题与目标

- 专栏索引页（`index_topic`）目前复用 wiki 列表的卡片结构与样式（`post-list wiki topic` / `post-card wiki topic` / `topic_card.ejs` 图标 + 标题 + 描述），需要独立布局。
- 新布局：专栏自上而下排布，每个容器上下堆叠——顶部为 `h2.topic-title` 专栏标题（复用 story 文章 h2 样式）；中间为**最新文章卡片**（背景用专栏封面 `topic.cover`，全宽 2:1，底部渐变模糊文字区显示最新文章标题、发布时间，整卡跳转最新文章）；底部为该专栏**其他文章**（排除最新，最多 3 条，按发布时间倒序），样式复用友链文章订阅（`friends_and_posts`）的文章链接列表。
- 抽象两个公共组件：①「描述 + 文章链接列表」`.post-panel`（友链文章订阅 JS 与专栏卡片 EJS 输出同一结构，样式只维护一份）；② 最新文章封面卡片 `latest_post_card`（接收 `{href, background, label, post}`，未来首页等场景可直接复用）。
- 成功标准：`/topic/` 五个专栏按新布局展示且各区域可点击；`/friends/` 友链文章订阅渲染与交互不受影响；无文章专栏仅渲染左侧卡片（专栏名 + 默认背景）。

## 2. 技术方案

### 模板（`layout/`）

- `layout/index_topic.ejs`：容器类 `post-list wiki topic` → `post-list topic`；卡片外层由 `<a class="post-card wiki topic">` 改为 `<div class="post-card topic">`（文章链接不能嵌套在整卡链接内），`post-card-wrap` 与 `scrollreveal` 保持。
- 新增 `layout/_partial/main/post_list/latest_post_card.ejs`（公共组件）：输出 `<a class="cover" position="bottom" style="--cover-url:...">` + `<img>` + `.cover-info`（`.text.topic` = 可选标签行、`.text.headline` = 最新文章标题、`.text.caption` = 发布时间，`date(post.date, config.date_format)`）；无 `post` 时仅渲染标签行，`href` 回退 `/`。
- `layout/_partial/main/post_list/topic_card.ejs`：`article` 顶部输出 `<h2 class="topic-title">` 专栏名（置于卡片外，非链接）与 `p.topic-desc` 专栏描述；中间调用 `latest_post_card`（`background = topic.cover || topic.icon || theme.default.topic`，本页不传 `label`）；底部渲染 `.post-panel` 内 `.posts`，取 `topic.pages.slice(1, 4)` 输出 `a.post-link`（`span.title` + `span.date`）。

### 公共组件（`source/css/`、`source/js/`）

- 新增 `source/css/_components/partial/post-panel.styl`：把 `friends_posts.styl` 中 `.desc/.posts/.post-link/.no-post` 样式迁移并泛化为 `.post-panel` 结构；移除未被 JS 使用的 `.empty/.spacer`；`.post-link` 的 hover 左侧高亮条、标题两行截断、日期小字等行为不变。
- `source/js/services/friends_and_posts.js`：`.previews` → `.post-panel`，内部结构（`.desc` / `.posts` / `.post-link` / `.no-post`）不变。
- `source/css/_components/tag-plugins/friends_posts.styl`：仅保留友链卡片网格、头像、标签等专属样式；容器 hover 的 `.desc:before` 规则与 `.post-link:hover` 颜色改到 `.post-panel` 体系下。
- 新增共享 mixin `story-title()`（`source/css/_common/title.styl`）：story 文章 h2 身份样式（居中 + 两侧 accent 斜杠装饰）；`article-story.styl` 的 `h2:not([class])` 改为调用该 mixin（渲染输出不变），专栏标题 `.topic-title` 复用同一 mixin。
- `source/css/_components/list.styl`：
  - 把 `.post-card.post.photo .cover` 的渐变模糊层、`.cover-info`、`.text` 规则泛化到 `.post-list .post-card .cover`（复用 `cover-overlay` 统一覆盖层：同图渐变模糊层 + 黑色蒙版 + hover 放大/变暗），photo 专属 `img` 比例与 hover 覆盖规则保留在 `.post.photo`。
- 新增 `// topic` 区块（纯平铺）：去掉卡片背景/阴影/圆角/`clip-path`（`.post-list.topic` 下覆盖 `.post-card-wrap` 与 `.post-card`），条目之间以 1px `--block-border` 分隔线衔接，`md-text` 上下内边距加大为 `2.25rem 0`（移动端 `1.5rem 0`）拉开专栏间隔；条目内 `article` 为 `flex-direction: column` 上下布局（所有断点）；`.topic-title` 应用 `story-title()`（间距 `margin: 0 0 0.5rem`），`.topic-desc` 居中次要色小字（`padding: 0 1rem` 与文章列表一致，`margin: 0 0 1rem`）；`.cover` 为 `flex: none; width: 100%; aspect-ratio: 2 / 1; border-radius: $border-card-l; overflow: hidden` + Safari 圆角裁剪 `clip-path` 兜底，`img` 撑满 `object-fit: cover`；`.post-panel` 为 `flex: none; width: 100%; padding: 0 1rem`（左右内边距与封面文字区一致），`.posts` 顶部 margin 归零。

### 数据（主仓库 `source/_data/topic/*.yml`）

- 5 个专栏新增 `cover` 字段，取值沿用现有 `icon` URL（wiki 数据既有约定：`cover` 与 `icon` 同图），图片由 CSS 按 2:1 + `object-fit: cover` 统一呈现。

## 3. 影响范围

- 对外行为：专栏索引页卡片布局变化（不再复用 wiki 卡片，上下布局 + 卡片外 h2 标题）；友链文章订阅 DOM 类名 `.previews` → `.post-panel`（对外样式类名变化，无配置项变化）。
- 兼容性：友链文章订阅视觉与交互保持一致；wiki 列表与 photo 文章卡片不变（`.cover` 规则泛化后行为等价）；story 文章 h2 样式经 mixin 抽取后渲染输出不变。
- 需要同步的知识库页面：`docs/knowledge/03-内容系统/post-lists-cards.md`（新增 topic 卡片变体与 `cover` 字段）、`docs/knowledge/04-标签插件/social-content-card-tags.md`（friends_and_posts 结构）、`docs/knowledge/知识库全量.md`、`docs/knowledge/VERIFICATION.md`；主仓库 `source/wiki/stellar/topic.md`。

## 4. 验证方式

- 主工程 `npm run g` 全量构建。
- `npm run s` 预览 `/topic/`（五个专栏卡片布局、跳转、移动端堆叠）与 `/friends/`（友链文章订阅）。
- `python3 docs/knowledge/tools/verify.py` 硬事实核查。
