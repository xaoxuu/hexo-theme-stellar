# 加固 canonical 提示：源站链接从 encoded 反解

> 日期：2026-08-09 | 状态：已实施

## 问题

非法克隆站提示中的「源站」链接由 `window.canonical.originalHost` 拼出。搬运机器人「原封不动复制页面 + 批量替换域名」时，`originalHost`、canonical 标签与 `permalink` 都会被替换为克隆域名，而 `encoded`（base64）不会随全局替换更新，因此：

- 检测仍能命中（这是当前设计的优势）；
- 但提示的「源站」会显示并跳转到克隆站自身，反而误导读者；
- `originStatusCheck()` 探测脚本会请求被替换的错误域名。

## 方案

`source/js/main.js` 的 `canonicalCheck()` 中，真实主站域名一律从 `encoded` 反解：

- 新增 `getOriginalHost()`：`atob(canonical.encoded)` 反解，异常或为空时回退 `originalHost`。
- `showTip()`：`originalURL` 与跳转链接 `currentURL`（真实域名 + `permalink` 的 pathname/search）均基于 `getOriginalHost()`。
- `originStatusCheck()`：主站判断与探测脚本地址改用 `getOriginalHost()`。
- 入口守卫改用 `getOriginalHost()`，避免 `originalHost` 被清空时提前退出。

## 影响范围

- 仅影响非主站访问时的提示展示与跳转；主站行为不变。
- 不新增配置项，无破坏性变更。

## 验证

- 用线上首页 HTML 模拟：原封不动搬运 → 提示指向 `https://xaoxuu.com`；批量替换域名 → 提示仍弹出且指向 `https://xaoxuu.com`；同步重写 `encoded` → 无法由前端防住（预期内，纯前端方案上限）。
- `npm run g && npx gulp minify` 全量构建通过。
