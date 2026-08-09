# TOC 目录链接平滑滚动

> 日期：2026-08-09

## 背景

侧边栏 TOC（`#data-toc`）的目录链接走浏览器默认锚点跳转，点击即瞬跳；同组件的「回到顶部」「参与讨论」按钮（`main.js` 的 `scrollTop` / `scrollComment`）使用 `behavior: "smooth"` 平滑滚动，体验不一致。使用方站点已关闭全局 `smooth_scroll`（即 `scroll-behavior: smooth`），因此需要定向处理，而非全局开启。

## 方案

- `source/js/main.js` `init.sidebar()`：在 `#data-toc a.toc-link` 点击时：
  1. 目标节点存在时 `e.preventDefault()`，调用自定义平滑滚动：`requestAnimationFrame` + easeOutCubic，短距离约 180ms、长距离最长 350ms（原生 `behavior:"smooth"` 约 500ms 起，偏慢），落点偏移 32px（与 `activeTOC` 的 `scrollOffset` 一致）；用 `history.pushState(null, "", href)` 同步 URL hash（不触发二次滚动）。
  2. 目标节点不存在时不做拦截，回退浏览器默认行为。
  3. 保留原有 `sidebar.dismiss()` 逻辑。
  4. 滚动动画绑定全局 `wheel` / `touchstart` 取消，用户手动滚动时立即打断动画。
- 标题 id 在 HTML 中为原始字符，href 为 URL 编码形式，取目标时用 `decodeURIComponent` 还原（与 `activeTOC` 中 `encodeURI` 匹配逻辑对应）。

## 影响范围

| 文件 | 改动内容 |
|------|---------|
| `source/js/main.js` | `init.sidebar()` TOC 链接点击处理增加平滑滚动 |
| `docs/designs/2026-08-09-toc-smooth-scroll.md` | 本设计文档 |

- 不改变 TOC 高亮（`activeTOC` / `scrollTOC`）、折叠（`collapse`）与侧栏关闭行为。
- 落点偏移 32px，与 `activeTOC` 判定一致；不再依赖 `<html>` 的 `scroll-padding-top`。

## 高亮边界修正

平滑滚动后目标标题顶落在 32px 偏移线上，滚动位置取整可能使标题顶落在 32.1~32.4px，`activeTOC` 的 `segTop > scrollTop + scrollOffset` 判定将其排除，高亮回跳到上一条（首个标题时可能无高亮）。在判定中增加 4px 容差（`scrollTolerance`），取整误差不再影响高亮。

## 执行计划

1. 修改 `source/js/main.js`
2. 全量验证：`npm run g`（hexo generate + gulp minify）
3. 本地预览：文章页点击 TOC 链接
4. 提交主题仓库，更新主仓库子模块指针

## 测试记录

### 2026-08-09

- `npm run g`（hexo generate + gulp minify）全量构建通过：204 个页面生成，HTML/CSS/JS 压缩无结构错误。
- 无头 Chrome 实测 `blog/20170628`：点击第 3 个 TOC 链接，约 190ms 完成动画，落点 `headingTop=32px`，URL hash 同步为 `#%E6%8E%88%E6%9D%83`。
- 长页面实测 `notes/server`：3267px 长距离跳转约 330ms（350ms 上限内），落点 `headingTop=32px`。
- 动画中途派发 `wheel` 事件：滚动立即停止在打断位置，无回弹。
- 高亮边界修正后重测（桌面视口 1440x900）：`blog/20170628`（4 条）、`notes/server`（11 条）、`blog/20200823`（3 条，用户报告「如何在主题中使用？」必现）点击后高亮均与点击项一致；修正前落点 32.1~32.4px 会回跳到上一条。
- 带 hash 直接打开页面（如 `blog/20200823/#如何在主题中使用？`）：高亮正常。
