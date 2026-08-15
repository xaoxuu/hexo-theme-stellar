# 修复评论区选择表情后自动打开 fancybox

> 日期：2026-08-15 | 状态：已实施

## 问题

在评论区（Artalk）打开表情面板选择表情时，点击表情图片会同时触发 Fancybox 弹窗，而不是仅插入表情。

## 根因

2026-08-09 的懒加载与 fancybox 配置简化（`84c6aff`）将评论图片选择器从

```js
.with-fancybox .atk-content img:not([atk-emoticon])
```

放宽为

```js
.with-fancybox img:not([atk-emoticon]):not([class*="emo"])
```

Artalk 2.9.1 表情面板的图片标记为 `<span class="atk-item"><img src="..." alt="..."></span>`：图片本身既无 `atk-emoticon` 属性，class 也不含 "emo"，因此未被排除规则命中。Fancybox 的委托点击监听（`Fancybox.bind(selector)` 绑定在 document 上）在点击表情图片时执行，导致误弹窗。Twikoo 的 OwO 表情面板图片（`<li class="OwO-item"><img>`）同样存在该问题；Waline 表情面板图片带 `wl-emoji` class，已被现有排除规则覆盖。

## 方案

将评论图片选择器收回到各评论服务的评论内容区，编辑器、表情面板、头像等非内容区图片不再匹配：

```js
var selector = '[data-fancybox]:not(.error), .with-fancybox .atk-content img:not([atk-emoticon]):not([class*="emo"]), .with-fancybox .tk-content img:not([atk-emoticon]):not([class*="emo"]), .with-fancybox .wl-content img:not([atk-emoticon]):not([class*="emo"])';
```

内容区类名：Artalk `.atk-content`（评论正文容器）、Twikoo `.tk-content`、Waline `.wl-content`。保留 `[atk-emoticon]` 与 `[class*="emo"]` 排除，评论正文中的表情图仍不弹窗。

## 影响范围

- `layout/_plugins/fancybox.ejs`：默认选择器（`needFancybox` 按需加载兜底、`mode: global` 的 `.md-text img` 追加、`conf.selector` 追加均不变）
- 对外行为：评论内容图片仍可弹窗；表情面板、编辑器、头像不再误触弹窗；正文与 `data-fancybox` 图片行为不变
- 无配置项 / API 变化，无新增依赖
- 文档同步：`docs/knowledge/07-外部集成/plugin-system.md` Fancybox 小节补充说明；`docs/knowledge/VERIFICATION.md` 登记

## 验证

- 主工程 `npm run g` 全量构建通过，生成页面含新选择器
- `python3 docs/knowledge/tools/verify.py` 硬事实核查通过
- 手工验证（用户预览）：Artalk 表情面板点表情只插入不弹窗；评论正文图片点击正常弹窗；头像与编辑器区域图片不弹窗；正文图片弹窗行为不变
