---
title: v2 Appearance、Resources 与 Inject 最终收敛
date: 2026-08-25
issue: 729
---

# 问题

Appearance 仍公开重复字体、主题色旧命名、渐变角度和带 CSS 包装的资源值；Resources 仍暴露只应由主题固定的占位资源；Inject 的插入位置命名也不够准确。四个配置切片还需要统一执行最终契约、旧字段扫描和 Alpha 门禁。

# 最终契约

- Resources 只公开 `preconnect`、`fallbacks.avatar/link_card/cover` 与 `error_page.image`；`project_icon/banner/topic_cover/image` 使用主题内部资源或退出公开配置。
- Typography 使用 `font_family.body/code` 与 `content_align`；颜色使用 `colors.primary/accent/link`；渐变角度固定为内部 `210deg`。
- Code Block 使用 `highlight_stylesheet: Resource|null`；Background image 接受原始 Resource，不接受 `url(...)`；`blur` 改为 `backdrop`。
- Appearance 的颜色、渐变、圆角、长度、透明度、饱和度、selector 和 motion 枚举由 Schema 严格校验。
- Inject 使用 `head_end/body_end`；站点文本在前、页面文本在后，仅用一个换行拼接，不解析、不格式化。
- 旧路径只由 doctor 来源化报错，不兼容读取、自动改写或静默 fallback。

# 边界

- `seo` 完全不改。
- `resources.preconnect` 的 Schema、默认值、覆盖与生成输出完全不改。
- 主题 issue 自动闭环只提交并推送主题 `v2` 分支；主仓库与公开 Wiki 子模块保持未提交，等待站长审查。

# 验收

- Schema 正反例、默认值、级联、camelCase、封闭边界、doctor 与真实 CSS/EJS 消费链测试通过。
- Error Page、Background、Highlight 与 trusted inject 有生成结果断言。
- Reference、Blueprint、内部知识库、公开 Wiki 和主站覆盖一致。
- Node.js 22 下 `npm run check`、`npm run integration:check` 与主工程 `npm run g` 通过。
- 最终扫描无旧字段、AI Summary、MathJax v2、旧 Mermaid CSS 和失效标签参数残留；SEO 与 preconnect 不变。
