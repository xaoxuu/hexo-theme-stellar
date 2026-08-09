# 左栏滚动位置恢复（通用版）

> 日期：2026-08-09

## 背景

移除 PJAX 后页面切换为完整刷新，浏览器只处理主文档滚动，左栏滚动容器 `.l_left .widgets` 的 `scrollTop` 不会被恢复，用户在 Wiki、笔记、文章等页面连续切换时，左栏总回到顶部。

左栏所有组件（wiki 树、笔记标签树、最近文章、标签云等）共用 `.widgets` 这一个滚动容器，因此"保存/恢复左栏滚动位置"的机制与具体组件无关，可以推广到所有有左栏的页面；需要区分的只是分组 key 和激活项修正选择器。

## 目标

- 所有有左栏的页面在切换后恢复左栏滚动位置。
- 恢复后若左栏导航的激活项（`.widgets a.link.active`）不可见，做最小幅度滚动使其可见；无激活项的组件（recent、tagcloud 等）只恢复位置、不做修正。
- 不重新引入 PJAX 或页面级状态管理；不处理右栏。

## 方案

### 存储与 key

- `sessionStorage`，key 为 `Stellar.leftbarScroll.<scope>`，scope 解析规则（`init.leftbarScroll()` 内实现为一个小函数）：
  1. 存在 `.doc-tree`（wiki 树，含以 wiki 实现的笔记区）→ `wiki:<data-wiki>`
  2. 存在 `widget[data-notebook]`（notebook 标签树）→ `notebook:<data-notebook>`
  3. 其他页面 → `layout:<.l_body 的 layout 属性>`，缺失时兜底 `layout:default`
- 各段用 `encodeURIComponent` 转义；不同 scope 之间不共享状态。

### 模板改动（各一行）

- `layout/_partial/widgets/tree.ejs`：根节点 `<widget class="widget-wrapper doc-tree post-list">` 增加 `data-wiki="<%= page.wiki %>"`（wikiId 来自 front matter，与 URL 路径不一致，无法从 URL 推导，必须保留）。
- `layout/_partial/widgets/tagtree.ejs`：根节点增加 `data-notebook="<%= page.notebook %>"`（notebook 未启用时无影响）。

### 前端（source/js/main.js）

新增 `init.leftbarScroll()`，挂入 `stellar.initPage()`：

1. 保存：`window.addEventListener('pagehide', ...)` 时读取左栏滚动容器（`document.querySelector('.l_left .widgets')`）的 `scrollTop` 写入 sessionStorage。一个监听覆盖所有离开路径，不拦截任何点击。
2. 恢复：页面加载时若左栏滚动容器存在，且上一页与当前页属于同一分区（`Stellar.leftbarScroll.last` 与当前 scope 一致），直接 `scrollTop = 存储值`；越界值浏览器自动 clamp，无记录时跳过。
3. 修正：取 `.widgets a.link.active`（wiki 树与笔记标签树共用 `a.link.active`，同一容器内通常只有一个；取第一个即可），用容器相对坐标（`getBoundingClientRect` 纵向差值，等价于 `offsetTop/offsetHeight` 对比容器 `scrollTop/clientHeight`）判断可见性：上方不可见则向上滚至链接顶部露出（默认留白 16px），下方不可见则向下滚至链接底部露出；无激活项或已可见时不动作。

- 不用 `scrollIntoView({block:'nearest'})`：会连动祖先滚动容器，移动端左栏收起时可能误滚主文档。
- 不用 URL 推导 wikiId（已验证不可行）。
- `sessionStorage` 读写均包裹 try/catch，不可用时静默跳过。
- 保存时同时写入 `Stellar.leftbarScroll.last` 记录上一页所在分区；仅连续在同一分区内翻页才恢复，离开分区（如 Wiki → 首页/其他 Wiki）再回来不恢复旧位置，避免"隔了别的页面再回来突然跳回深处"的突兀感。

## 实现边界

- 仅作用于左栏 `.l_left .widgets`；右栏 TOC 已有自己的滚动逻辑，不在范围内。
- 页面级 front matter 覆盖 leftbar 时，key 仍按分区共享；个别页面结构差异可能导致位置不完全对应，但 scrollTop 自动 clamp、修正仅在存在激活项时动作，影响可控。
- `sessionStorage` 不可用（隐私模式/禁用）时静默跳过，不影响跳转。
- 前进/后退由浏览器处理主文档滚动；bfcache 恢复页面不重跑脚本，左栏位置在下次加载时按存储值恢复。
- 首次访问某分区（无记录）不恢复；从其他分区回到本分区（`last` 不匹配）也不恢复。

## 风险与取舍

- 分区级 key（wiki/notebook/layout）而非"分区 + 页面路径"级：状态简单、行为稳定，同一分区内共用一份位置，牺牲逐页记忆。
- 最小修正而非强制居中：少跳动、保留上下文；视觉聚焦感弱于居中。
- 仅"连续同分区浏览"恢复：离开分区再回来从头开始，避免恢复过期位置；代价是"Wiki → 首页 → Wiki"这类往返不会恢复之前的位置。
- 低复杂度优先，以上取舍可接受。

## 验证

- 同一 Wiki 内从目录树深处切页：左栏先恢复到上次位置；激活项不可见时仅小幅滚动，已可见时零跳动。
- Wiki → 首页/文章页 → Wiki 往返：再回来时不恢复旧位置，左栏从头开始；无 `.doc-tree`/`widget[data-notebook]` 的页面无修正行为。
- 启用 notebooks 的场景（如主题演示站）：不同 notebook 之间各自恢复（`data-notebook` 隔离）。
- 隐私模式/禁用 sessionStorage 时无报错；普通文章页、首页等无激活项的页面零异常。
- `npm run g`（hexo clean && generate && gulp minify）全量构建通过。
