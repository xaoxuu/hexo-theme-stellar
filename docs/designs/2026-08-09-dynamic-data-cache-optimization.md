# 动态数据缓存优化（v1.36.0 后续）

> 日期：2026-08-09 | 版本：v1.37.0+ | 前置方案：[2026-08-09-dynamic-data-cache.md](./2026-08-09-dynamic-data-cache.md)

## 背景

v1.36.0 已为动态数据组件接入 stale-while-revalidate 本地缓存（`utils.request` / `requestWithoutLoading`）。上线后仍存在以下体验盲区：

1. **页面内并发重复请求**：`utils.request` 只按元素去重（`_loadedElements`），没有 URL 级 in-flight 去重。同一页多个组件请求同一接口（如同 API 的多个 memos、多张 cardlink 指向同一站点）会各自发起 fetch；TTL 刚过期时整页组件同时刷新，外部 API 瞬时压力翻倍。
2. **Memos 用户详情 N+1 且绕过缓存**：`memos.js` 中 `fetch(${memos.site}/api/v1/users/${creatorId})` 为裸 fetch，即使 memo 列表命中本地缓存，渲染时仍逐条请求用户详情且不落缓存；另残留 `console.log(JSON.stringify(user))` 调试输出。
3. **stale 降级行为不一致**：`request` 在过期刷新失败时保留缓存内容；`requestWithoutLoading` 在缓存过期且请求最终失败时直接 reject，无 stale 兜底，调用方会闪失败态。
4. **缓存写入时机**：每次请求成功后立即在主线程 `clone().text()` + `setItem`（单条最大 200KB），在 cardlink 较多的页面上会阻塞渲染主线程。

## 方案

### 1. URL 级 in-flight 请求去重（`layout/_partial/scripts/utils.ejs`）

新增 `utils._pendingRequests` Map（key 为 `method + ' ' + url`）与 `utils._fetchShared(url, options)`：

- 首次请求创建 fetch promise 并存入 Map，`.finally` 中清理；
- 后续同 URL 请求复用该 promise，并各自 `resp.clone()` 取回独立 Response（避免 Response body 只可消费一次导致重复渲染失败）；
- `utils.request` 与 `requestWithoutLoading` 统一改走 `_fetchShared`，去重对两者同时生效；
- 元素级 loading/渲染回调/重试逻辑保持不变，仅共享网络层。

### 2. Memos 用户详情接入缓存（`source/js/services/memos.js`）

- `22+` / `25+` 版本中用户详情 `fetch` 改为 `utils.requestWithoutLoading(url, { service: 'memos-user' })`，TTL 由 `data_cache.ttl.memos-user` 控制（默认 86400）；
- 保留渲染内 `memos.requests` 去重与 `.finally` 清理；
- 新增 `.catch(() => { user = null; })`：单条用户详情失败时回退默认昵称/头像，不再让整块 memo 渲染失败；
- 删除 `25+` 分支的 `console.log(JSON.stringify(user))` 调试输出。

### 3. `requestWithoutLoading` stale 兜底（`layout/_partial/scripts/utils.ejs`）

- 最终超时或请求失败时，若存在 stale 缓存则 `resolve(utils.cache.toResponse(cached))`，与 `request` 行为一致；
- 无缓存时保持原有 reject；
- 顺带修复超时后晚到响应/错误可能重复调度 retry 的竞态（增加 `timedOut` 守卫）。

### 4. 延迟写缓存（`layout/_partial/scripts/utils.ejs`）

新增 `utils._defer(fn)`：优先 `requestIdleCallback(fn, { timeout: 3000 })`，否则 `setTimeout(fn, 0)`。`request` 与 `requestWithoutLoading` 中的缓存写入（clone + read + setItem + trim）全部经 `_defer` 延后执行，让出主线程。

## 改动清单

| 文件 | 改动 |
|------|------|
| `docs/designs/2026-08-09-dynamic-data-cache-optimization.md` | 本设计文档 |
| `layout/_partial/scripts/utils.ejs` | 新增 `_pendingRequests` / `_fetchShared` / `_defer`；`request` 与 `requestWithoutLoading` 接入去重、延迟写与 stale 兜底 |
| `source/js/services/memos.js` | 用户详情改走 `requestWithoutLoading`（`service: 'memos-user'`）、失败回退、移除调试日志 |
| `_config.yml` | `data_cache.ttl` 新增 `memos-user: 86400` |

## 执行计划

1. `utils.ejs`：`_fetchShared` + `_defer` + 两处请求入口接入
2. `memos.js`：用户详情缓存化 + 失败回退 + 去日志
3. `_config.yml`：补充 `memos-user` TTL
4. Node 单测（mock localStorage/fetch/Response）覆盖：去重、stale 兜底、延迟写、既有缓存用例回归
5. 全量验证：`npm run g`（hexo generate + gulp minify）
6. 本地 `npm run s` 冒烟验证含 `ds-*` 服务页面

## 测试记录

### 单测

- [x] 同 URL 并发 `utils.request` 仅发一次 fetch，两个元素各自渲染
- [x] `requestWithoutLoading` stale 缓存 + 请求失败 → 返回缓存内容
- [x] `requestWithoutLoading` 无缓存 + 请求失败 → reject
- [x] 缓存写入经 `_defer` 延后执行
- [x] 既有 v1 用例回归（命中、过期刷新去重、mdrender 绕过、配额淘汰）
- [x] `request` 与 `requestWithoutLoading` 同 URL 共享去重（15/15 通过）

### 全量构建

- [x] `npm run g` 通过（hexo generate + gulp minify）

### 场景用例

- [x] 首页 / 友链页 / memos 文章页 / Wiki 页本地 `npm run s` 冒烟通过（HTTP 200，`ds-*` 服务正常注入）
- [ ] 含多 cardlink / 多 memos 页面并发请求去重（DevTools Network 仅一次请求，需真实浏览器验证）
- [ ] memos 用户详情二次访问不重复请求（TTL 内，需真实浏览器验证）
- [ ] memos 用户详情接口失败时组件正常渲染（默认昵称/头像，需真实浏览器验证）
