---
title: 用户内容 HTML 转义加固
date: 2026-08-13
status: 已实施
---

# 用户内容 HTML 转义加固 方案

## 1. 问题与目标

主题多处把用户内容（文章标题、摘要、封面 URL、分类/标签、wiki 字段、相关文章标题、分享参数等）直接拼入 HTML 属性或文本：属性值未转义时，标题含引号会截断属性并产出畸形 HTML（`hexo-minify` 解析失败，如 penndu/hexo 的 `Render HTML failed: archives/index.html` 与主工程分享按钮 `href` 报错）；文本内容未转义时，`&`/`<` 会被当作实体起点或标签。

目标：用户数据进入 HTML 属性一律转义；文本内容同样转义 `&`/`<` 等危险字符（统一使用 `escapeHTML`，对属性与文本均安全）；URL 查询参数用 `encodeURIComponent` 编码后再拼入 `href`。

## 2. 技术方案

- 新增 `scripts/helpers/escape_html.js`：注册 `escape_html` 模板辅助函数，包装 `hexo-util` 的 `escapeHTML`（先 `String()` 兜底，避免非字符串抛错）；新增对应单测 `test/escape_html.test.js`。
- `layout/_partial/main/article/article_footer.ejs`：微博/邮件分享 URL 的 `url`、`title`、`pics`、`summary`、`subject`、`body` 参数改经 `encodeURIComponent` 编码；`copy-link` 输入框 `value` 与复制提示文案经 `escape_html`；二维码 `data` 参数经 `encodeURIComponent`。
- `layout/_partial/main/pin_slider.ejs`：幻灯片标题、小字、封面 URL（`src` 与 `style`）、链接 `href`、wiki 标题/摘要/标签/链接/封面统一 `escape_html`。
- 同类加固：`scripts/helpers/related_posts.js`（标题/路径/摘要）、`layout/_partial/main/post_list/post_card.ejs`（封面、标题、摘要、topic/headline/caption、分类）、`layout/_partial/cover/post_cover.ejs`（`data-bg`）、`layout/_partial/sidebar/index_leftbar.ejs`（社交项 `title`/`href`）、`layout/_partial/main/navbar/nav_tabs_blog.ejs` 与 `nav_tabs_wiki.ejs`（分类/标签文本与链接）。
- 标签插件（`scripts/tags/lib/*`）的参数注入暂不在本次范围，留作后续加固。

涉及文件：

- `scripts/helpers/escape_html.js`（新增）、`test/escape_html.test.js`（新增）
- `layout/_partial/main/article/article_footer.ejs`、`layout/_partial/main/pin_slider.ejs`、`layout/_partial/main/post_list/post_card.ejs`、`layout/_partial/cover/post_cover.ejs`、`layout/_partial/sidebar/index_leftbar.ejs`、`layout/_partial/main/navbar/nav_tabs_blog.ejs`、`layout/_partial/main/navbar/nav_tabs_wiki.ejs`
- `scripts/helpers/related_posts.js`
- `docs/knowledge/03-内容系统/article-footer-metadata.md`、`docs/knowledge/05-前端交互/client-side-overview.md`、`docs/knowledge/知识库全量.md`、`docs/knowledge/VERIFICATION.md`

## 3. 影响范围

- 对外行为：标题/摘要/封面等含 `"`、`&`、`<` 时不再破坏 HTML 结构与构建；分享链接参数正确编码，微博/邮件分享 URL 语义不变。
- 兼容性：无配置项变更；`escape_html` 对纯文本是幂等安全转义，不影响正常显示。

## 4. 验证方式

- 新增纯函数单测，跑 `npm run check`（lint + 单测 + 知识库硬事实核查）。
- 主工程复现验证：临时新增带 `pin: 1`、标题含引号的文章，执行 `npm run g`，确认 `archives/index.html` 与含引号标题的分享按钮页面均正常生成；随后删除临时文章并 `hexo clean`。
