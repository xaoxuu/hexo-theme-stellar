---
title: 主题基础功能图标键统一为 default:语义名
date: 2026-08-15
status: 已实施
---

# 主题基础功能图标键统一为 default:语义名 方案

## 1. 问题与目标

主题基础功能（非标签插件）图标键目前是 `solar:图标名`（如 `solar:calendar-bold-duotone`），用户更换图标时难以从键名判断用途；此前尝试按用途分域（widget/ui/data/badge）命名，但图标可被多处复用，绑定用途域不合适。

目标：主题基础功能图标键统一为 `default:语义名`（`default:` 是主题内置图标的通用命名空间，不绑定用途、可任意复用），语义名描述图标本身/主要用途，便于用户识别与覆盖。

## 2. 技术方案

- `_data/icons.yml`：基础键按映射表改名为 `default:语义名`（arrow-left/right、documents、chat、planet、notebook、pin、shield-user/check/up/warning、repeat、like、edit、theme、upup、tocomment、calendar、category、category-open、bookmark.active、loading、comment、warning、image-onerror、hashtag）；移除零引用 `solar:pin-bold-duotone`；分区注释改为「主题基础功能 · default 内置图标 · 主视觉/界面控件/数据服务」；顶部「非 Solar 值保留图标」组保持（键本已是 default:*）。
- 引用同步（仅字符串）：layout（分页器、pin_slider、toc、sidebar、post_card、note_card、categories、contributors、comments×6、widgets、tags、article_tags）、`head.ejs` CSS 桥接（`--icon-h3-left/right` → `default:arrow-left/right`）、`defines.ejs` 客户端白名单（`default:comment/loading-spinner/warning/repeat/like`）、`scripts/tags/lib/`、`source/js/services/`、`_config.yml`（侧边栏图标默认值、ai_label 档位、image_onerror 注释）、`test/icons.test.js` 硬编码桥接键。
- 不改动：`github:`、`share:`、全部标签插件键（copy/download/hashtag-bold-duotone、hashtag-square-bold、ph、bxs、vote、rating、chat:*）；`solar:hashtag-bold-duotone`（{% hashtag %} 插件）保持不变。
- 修正（最终）：标签组件专用图标不归 `default:`，改用标签名命名空间——`default:comment/repeat/like` → `weibo:comment/repeat/like`（{% timeline %} 数据服务）、`default:image-onerror` → `image:onerror`（{% image %}）；`default:loading-spinner/warning/loading-placeholder` 等共享工具保留 `default:`。
- 修正（最终）：剩余 `solar:*` 标签插件键同样按标签名命名——`copy:copy`、`image:download`、`hashtag:hashtag`、`quot:hashtag`，icons.yml 中 `solar:` 前缀全部消除。
- 修正（最终）：{% quot %} 分区统一 `quot:` 前缀——`quot:question`、`quot:quote-left`、`quot:quote-right`，icons.yml 中 `ph:`/`bxs:` 前缀全部消除。
- 修正（最终）：仅出现在 `_config.yml` 注释示例中的图标用 `example:` 命名空间（`example:chat/planet/notebook`），与真实使用的图标区分。

涉及文件：`_data/icons.yml`、`layout/`、`scripts/tags/lib/`、`source/js/services/`、`layout/_partial/scripts/defines.ejs`、`layout/_partial/head.ejs`、`_config.yml`、`test/icons.test.js`、`docs/knowledge/`。

## 3. 影响范围

- 对外行为：无视觉变化（仅键名与引用改名，图标值不变）。
- 兼容性（破坏性）：键为公开接口，站点 `source/_data/icons.yml` 覆盖与 `_config.stellar.yml` 若引用旧 `solar:*` 主题键需同步改名；已确认主工程无此类覆盖。
- 需要同步的知识库：`03-内容系统/post-lists-cards.md`、`article-footer-metadata.md`、`04-标签插件/icon-tag.md`、`00-总览与安装配置/configuration.md`、`01-样式系统/design-tokens.md`、`02-布局系统/logo-navigation-headers.md`、`知识库全量.md`、`VERIFICATION.md`。

## 4. 验证方式

- 主题仓库 `npm run check`（lint + 单测 + 知识库硬事实核查；icons 键完整性单测校验全部新引用）。
- 主工程 `npm run g` 全量构建（scripts/ 有改动）。
- 产物抽查：各页面 SVG 路径与改名前一致；全仓库无旧键残留引用。
