# 动态插入的懒加载图片自动注册

> 日期：2026-08-12 | 作者：xaoxuu | 状态：已实施

## 背景与问题

dusays.com（Stellar 1.38.0）about 页右栏「近期评论」是站点自定义脚本：异步 fetch Artalk 最新评论后，直接向 DOM 注入：

```html
<img class="lazy" src="data:image/png;base64,1x1占位" data-src="https://.../avatar" />
```

自 1.36 懒加载重构后，CSS 对 `.lazy` 无条件 `opacity:0`；vanilla-lazyload 只在初始化与 `update()` 时注册懒加载元素。该脚本注入发生在 DOMContentLoaded 的 `update()` 之后，且不调用 `wrapLazyloadImages()`，导致注入的 `img.lazy` 从未被注册，永远停在 `opacity:0`，头像不显示。

无头 Chrome 复现结果：动态插入的 `img.lazy` 为 `data-ll-status:null`、`opacity:0`、未加载真实图片；加入 MutationObserver 兜底后变为 `loaded`、`opacity:1`、真实图片正常加载。

## 方案

在 `layout/_partial/scripts/lazyload.ejs` 增加 MutationObserver，检测到新增 `.lazy` 元素后自动调用 `window.lazyLoadInstance.update()` 重新注册：

- 监听 `document.documentElement` 的 `childList + subtree` 变更，仅对新增节点自身或其子树包含 `.lazy` 的变更触发。
- 使用 `requestAnimationFrame` 节流，同帧内多次插入只触发一次 `update()`。
- 调用完整的 `update()`（不传元素列表）：vanilla-lazyload 的 `update()` 会重建 IntersectionObserver，需要重新注册全部未加载元素。
- 观察器引用挂在 `window.lazyMutationObserver` 上，避免被垃圾回收。
- `wrapLazyloadImages()` 保持不变，仍负责把普通 `<img src>` 转换为懒加载标记。

## 影响范围

- `layout/_partial/scripts/lazyload.ejs`：新增兜底逻辑（约 20 行）。
- 无公开 API / 配置变更，无新依赖；懒加载强制开启、`no-lazy` 例外、fancybox 等既有行为不变。
- 行为变化：动态插入的 `.lazy` 图片（含第三方自定义脚本）不再依赖调用方手动 `update()`。

## 文档同步

- `docs/knowledge/07-外部集成/lazy-loading-images.md`：更新「页面加载后的懒加载更新」、流程图与更新方式表。
- `docs/knowledge/09-高级主题/performance.md`：更新动态内容懒加载段落。
- `docs/knowledge/知识库全量.md`：同步合并版。
- `docs/knowledge/VERIFICATION.md`：登记本次行为修正。

## 验证方式

- 主题仓库 `npm run check`（lint + 单测 + 知识库硬事实核查）。
- 主工程 `npm run g` 全量构建 + `npx gulp minify`。
- 无头 Chrome 回归：DOMContentLoaded 之后注入 `img.lazy` 能被自动注册并加载；静态 `.lazy` 与 `no-lazy` 图片行为不变。
- 页面覆盖抽查：首页 / 文章页 / Wiki 页 / 404 页。

## 检查清单

### 验证

- [x] 无头 Chrome 复现：动态注入 `img.lazy` 未注册（`data-ll-status:null`、`opacity:0`）
- [x] 无头 Chrome 验证：MutationObserver 兜底后图片自动加载（`loaded`、`opacity:1`）
- [x] `npm run check` 通过（lint + 单测 + 知识库硬事实核查）
- [x] 主工程 `npm run g` 全量构建通过（hexo generate + gulp minify）
- [x] 页面类型覆盖：首页 / 文章页 / Wiki 页 / 404 页（`lazyMutationObserver` 均注入）

### 文档同步

- [x] 设计文档（本文件）
- [x] `docs/knowledge/07-外部集成/lazy-loading-images.md` 已更新
- [x] `docs/knowledge/09-高级主题/performance.md` 已更新
- [x] `docs/knowledge/知识库全量.md` 已同步
- [x] `docs/knowledge/VERIFICATION.md` 已登记
