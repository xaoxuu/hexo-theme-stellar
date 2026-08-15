# 执行计划

1. 提取 `scripts/tags/lib/chat.js` 等处的硬编码 SVG 到 `_data/icons.yml`（脚本机械提取，视觉不变）。
2. 从 iconify 拉取 `solar:repeat-bold`、`solar:like-bold` 内联 SVG 写入 yml。
3. `scripts/events/lib/utils.js` 新增 `hexo.utils.iconData(key)`。
4. 服务端替换：ghuser/copy/about/banner/hashtag/image/chat 改用 `icon()` / `ctx.utils.icon()`。
5. CSS 桥接：`head.ejs` 生成 `--icon-*` 变量；`func.styl` mixin 调整；`_custom.styl` 删除 data-URI 变量；`article-story.styl` 改用变量。
6. 客户端注册表：`defines.ejs` 注入 `ctx.icons`；weibo/timeline/utils 改查 `ctx.icons`；emoji 换 solar。
7. 配置 URL 消费方：`default.loading` / `image_onerror` 按 `theme.default.* || iconData(key)` 读取。
8. 文档同步 + 单测 + 构建验证。
