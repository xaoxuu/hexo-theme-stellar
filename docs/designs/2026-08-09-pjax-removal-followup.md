# PJAX 移除收尾清理

> 日期：2026-08-09 | 作者：xaoxuu | 版本：v1.35.0（跟随 2026-08-08 移除提交）

## 背景

`cd182a8 refactor: remove pjax support` 已删除 PJAX 核心实现、样式、模板与配置，但遗留了两类 PJAX 时代产物：

1. **评论重初始化机制**（#646 引入）：6 个评论脚本将初始化函数注册到 `window.stellar.initComments`，`stellar.initPage()` 再循环调用一次。评论脚本本就自初始化（`// Initialize on page load`），PJAX 移除后该注册与循环成为重复执行的死代码。
2. **过时注释**：`main.js`、`utils.ejs` 及 6 个评论脚本中仍描述 PJAX 行为。

## 改动清单

| 文件 | 改动 |
|------|------|
| `layout/_partial/comments/{beaudar,artalk,utterances,giscus,twikoo,waline}/script.ejs` | 删除 `window.stellar.initComments.*` 注册与 "PJAX reinitialization" 注释（6 处） |
| `source/js/main.js` | 删除 `stellar.initPage()` 中 `stellar.initComments` 循环，更新函数注释 |
| `layout/_partial/scripts/utils.ejs` | 修正 `_loadedElements` 与插件初始化管理器注释（2 处） |
| `docs/audits/2026-08-08-stellar-analysis.md` | "PJAX 稳定化" 方向标记为已废弃 |

## 回归修复（2026-08-09 实测发现）

### 症状

删除注册与循环后，artalk 等 5 个评论系统加载不出来，控制台报：

```
Uncaught ReferenceError: util is not defined
```

### 根因

评论脚本是内联立即执行的经典 `<script>`，其中直接调用 `util.viewportLazyload(...)`；而 `util` 定义在带 `defer` 的 `main.js` 中（`const util = {...}`），内联脚本解析期执行时 `util` 尚未初始化。

此前评论实际依赖 `stellar.initPage()` 循环：main.js（defer）执行完、`util` 就绪后才调用注册的初始化函数。删除注册与循环后，内联脚本的直接调用成为唯一路径，必然抛错。waline 因本身是 `<script type="module">`（延迟执行）未受影响。

### 修复

5 个评论脚本（artalk / beaudar / utterances / giscus / twikoo）改回 `<script type="module">`——PJAX 之前的原始模式。模块脚本在文档解析完成后按文档顺序执行（晚于 defer 的 main.js），`util` 可用；评论仍由脚本自身初始化一次，无需注册表与循环。

| 文件 | 改动 |
|------|------|
| `layout/_partial/comments/{artalk,beaudar,utterances,giscus,twikoo}/script.ejs` | `<script>` → `<script type="module">`（5 处） |

### 验证

- headless Chrome 实测修复前：控制台 `ReferenceError: util is not defined`，`#artalk_container` 停留在 loading 占位
- 修复后：控制台无报错，评论正常渲染

## 影响评估

| 维度 | 影响 |
|------|------|
| 行为 | 评论初始化由各脚本自身执行一次；脚本改为 module 后延迟到文档解析完成后运行，加载时序与 PJAX 前一致 |
| 兼容性 | `stellar.initComments` 不再暴露，站点注入脚本如有依赖需同步移除（主工程已确认无引用） |
| 维护成本 | 消除 PJAX 时代死代码与误导性注释 |

## 验证记录

- [x] `npm run g && npx gulp minify` 全量构建无报错
- [x] 全库搜索无 `pjax` / `initComments` 残留（历史方案/审计文档除外）
- [x] 评论脚本仅初始化一次，且 headless Chrome 实测评论正常加载（见"回归修复"）
