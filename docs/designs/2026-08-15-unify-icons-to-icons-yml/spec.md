---
title: 主题内置图标统一迁移到 _data/icons.yml
date: 2026-08-15
status: 已通过
---

# 主题内置图标统一迁移到 `_data/icons.yml` 方案

## 1. 问题与目标

主题内置图标目前分散在多个位置：`_data/icons.yml`（已走 `hexo.utils.icon()` 统一解析）、`layout/` 与 `scripts/` 内联 SVG、`source/css/_custom.styl` 中的 data-URI（story 页 h3 双箭头、引用引号装饰）、`source/js/` 客户端硬编码 SVG 与 emoji、`_config.yml` 中的 URL 类图标（`default.loading`、`default.image_onerror`）。

目标：全部主题内置图标收敛到 `_data/icons.yml` 单一数据源，服务端模板/标签脚本、CSS 装饰、客户端 JS、配置 URL 类图标均从该文件读取；非 SVG 的 emoji（微博转发/点赞）替换为 solar 图标。除 emoji 替换外不改变任何图标视觉。

成功标准：

- `layout/`、`scripts/`、`source/js/` 下不再存在硬编码 `<svg>`（仅 icons.yml 与生成注入路径）。
- `_custom.styl` 不再包含图标 data-URI 变量。
- 客户端与服务端渲染结果与迁移前一致（chat、weibo/timeline、story 页、懒加载、破图图标）。

## 2. 技术方案

### 接口

- 新增 `hexo.utils.iconData(key)`：返回 icons.yml 原始值（内联 SVG 或 URL，不包 `<img>`），供 CSS 变量生成、懒加载背景图、客户端注册表使用；`icon()` 语义不变。
- 客户端新增 `window.ctx.icons` 白名单注册表，由 `layout/_partial/scripts/defines.ejs` 注入（先于 utils/services 执行）。
- `svg-mask-icon($img)` mixin 改为直接使用传入的完整 image-source（`var(--icon-*)` 或 `url(...)`），不再自行包裹 `url()`。
- 配置项 `default.loading` / `default.image_onerror` 保留为兼容回退；新值在 icons.yml（`default:loading-placeholder` / `default:image-onerror`），消费方按 `theme.default.* || iconData(key)` 读取。

### 图标键

- `default:`：copy、download、hashtag、comment、loading-spinner、warning、loading-placeholder（URL）、image-onerror（data-URI）
- `github:logo-alt`：ghuser 头部 TDesign GitHub logo
- `chat:`：浏览器 logo（google/safari/ie/uc/qq/baidu/firefox/360/qq-mini）、文件类型（word/ppt/txt/pdf/compressPkg/excel/code/photo/video/voice/config/database/link/exe/3d/unknow）、控制图标（voice-qq/voice-wechat/photos/camera/red-envelope/smile-qq/smile-wechat/more-qq/more-wechat/pause/play/download）
- `solar:repeat-bold`、`solar:like-bold`：微博转发/点赞 emoji 替换（从 iconify 拉取 bold 内联 SVG）
- 复用已有：`default:arrow-left`、`bxs:quote-left/right`、`solar:double-alt-arrow-left/right-bold-duotone`

内联 SVG 所需的 class（`class="icon"`、`class="loading"` 等）保留在 yml 值内，因为 `icon()` 对非 URL 结果会丢弃附加参数。

### CSS 变量桥接

`layout/_partial/head.ejs` 注入 `<style>`，从 yml 白名单（`bxs:quote-left/right`、`solar:double-alt-arrow-left/right-bold-duotone`）经 `encodeURIComponent` 生成：

```css
:root {
  --icon-h3-left: url("data:image/svg+xml,...");
  --icon-h3-right: url("data:image/svg+xml,...");
  --icon-quote-left: url("data:image/svg+xml,...");
  --icon-quote-right: url("data:image/svg+xml,...");
}
```

删除 `_custom.styl` 中 `$iQuoteLeft/Right`、`$iH3Left/Right`、`$iLoadingIcon`（后者当前未使用）；`article-story.styl` 改用 `var(--icon-*)`。

### 客户端注册表

`defines.ejs` 注入 `ctx.icons`（白名单：default:comment、default:loading-spinner、default:warning、solar:repeat-bold、solar:like-bold），JSON 序列化时将 `<` 转义为 `\u003c`，防止 `</script>`/`<!--` 解析问题；weibo/timeline 评论气泡、`utils.ejs` 加载/警告图标改查 `ctx.icons`。

### 涉及文件

- `layout/`：`_partial/head.ejs`、`_partial/scripts/defines.ejs`、`_partial/scripts/utils.ejs`、`_partial/widgets/ghuser.ejs`
- `scripts/`：`events/lib/utils.js`、`tags/lib/chat.js`、`tags/lib/copy.js`、`tags/lib/about.js`、`tags/lib/banner.js`、`tags/lib/hashtag.js`、`tags/lib/image.js`、`tags/lib/sites.js`、`tags/lib/posters.js`、`tags/lib/gallery.js`、`tags/lib/albums.js`、`tags/lib/friends.js`
- `source/css/`：`_custom.styl`、`_defines/func.styl`、`_components/pages/article-story.styl`
- `source/js/`：`services/weibo.js`、`services/timeline.js`
- `_data/icons.yml`、`_config.yml`（兼容回退注释）
- `docs/`：知识库 + 本方案目录

## 3. 影响范围

- 对外行为：无视觉变化（除微博转发/点赞 emoji → solar）；`default.loading` / `default.image_onerror` 仍可覆盖（兼容回退）。
- 兼容性：`icon()` 语义不变；`theme.default.loading` 消费方优先读旧配置，未设置时回退到 icons.yml。
- 需要同步的知识库：`04-标签插件/icon-tag.md`、`01-样式系统/design-tokens.md`、`01-样式系统/styling-overview.md`、`00-总览与安装配置/configuration.md`、`VERIFICATION.md`、`知识库全量.md`。

## 4. 验证方式

- 主题仓库 `npm run check`（lint + 单测 + 依赖声明 + 知识库硬事实核查）。
- 为 `iconData()` 补单测；增加 icons.yml key 完整性单测（遍历 `icon()`/`iconData()` 引用，缺失即失败）。
- 主工程 `npm run g` 全量构建。
- 页面抽查：story 文章（h3 双箭头、引用引号）、chat QQ/微信两风格、weibo/timeline、懒加载占位、破图图标、评论系统 loading。
