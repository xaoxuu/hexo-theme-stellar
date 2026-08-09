# 移除官方备用站的「关闭提示」逻辑

> 日期：2026-08-09 | 状态：已实施

## 问题

官方备用站底部的备用站提示（`本站为官方备用站，仅供应急。点击移步主站`）允许读者点击「关闭提示」按钮隐藏，关闭状态通过 `localStorage` 持久化，当天再次访问不再显示。

该提示存在的意义是防止读者误收藏、误分享备用站地址；允许关闭会削弱这一保障，且按钮与本地存储逻辑（`Stellar.canonical.closeEnable` / `Stellar.canonical.closeTime`）增加了维护成本。

## 方案

移除官方备用站提示中的关闭能力，提示在官方备用站上始终展示（主站无法访问时的 `originStatusCheck` 兜底保留）：

- `source/js/main.js`：
  - 删除 `showTip()` 中读取 `localStorage` 判断「已关闭/今日已关闭」的分支，仅保留 `originStatusCheck()` 兜底。
  - 删除官方提示 HTML 中的 `#canonical-close` 关闭按钮。
  - 删除 `#canonical-close` 的点击事件与 `localStorage` 写入逻辑。
- `_config.yml`：删除 `canonical.closeEnable`、`canonical.closeText` 两个配置项。
- `source/css/_common/canonical.styl`：关闭按钮删除后，`.canonical-tip` 内选择器由 `a, button` 收敛为 `a`，移除 `button` 块；官方提示增加 `.canonical-tip.official` 卡片背景，链接不再呈现按钮样式。

## 影响范围

- 仅影响官方备用站提示：不再显示「关闭提示」按钮，提示不可手动隐藏。
- 非法克隆站提示（`canonical-tip.unofficial`）不受影响，本就不含关闭按钮。
- 主站（`originalHost`）不触发提示，不受影响。
- 移除 `closeEnable` / `closeText` 配置项属于主题配置清理，使用方如声明了这两项也不会报错（多余配置键被忽略）。

## 验证

- `npm run g && npx gulp minify` 全量构建通过。
- 本地以 `localhost` 作为官方备用站主机，确认官方提示展示且无关闭按钮；注释掉 `originStatusCheck` 场景不影响其他页面。
