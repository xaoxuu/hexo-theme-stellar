---
title: 本地搜索懒加载与缓存 TTL
date: 2026-08-15
status: 已实施
---

# 本地搜索懒加载与缓存 TTL 方案

## 1. 问题与目标

- 现状：每次页面加载都无条件 `fetch /search.json`（即使 `localStorage` 已有缓存也会重新请求），绝大多数访问者不打开搜索也白白下载索引；搜索缓存无有效期。
- 目标：
  - 新增 `search.local_search.lazy_load`（默认 `true`）：页面加载时不请求、不初始化搜索，首次聚焦搜索框才加载（缓存优先 + 后台刷新）。
  - 新增 `search.local_search.cache_ttl`（默认 `86400` 秒 = 1 天）：缓存带有效期，未过期不发请求，过期时先显示旧缓存并后台刷新；`0` 表示不缓存。
  - 非懒加载模式同样改为「缓存新鲜则不请求」。

## 2. 技术方案

- `layout/_plugins/search/local_search.ejs`：DOMContentLoaded 时把 `conf` 合并进 `ctx.search`（保留原有字段，新增 `path` 与 `local_search` 全量配置），供客户端 JS 读取。
- `source/js/search/local-search.js`：
  - 缓存升级 `search_cache_v2`：`{ ts, ttl, data }`；新增 `loadCacheIntoMemory()` / `isCacheFresh()` / `needsFetch()` / `fetchSearchData()`（单飞 promise，防并发重复请求）。
  - 页面加载预取仅 `lazy_load !== true` 时执行；聚焦触发改为 `document` 级 `focusin` 委托，`data-filter` 每次现读。
  - 输入监听读取模块级 `searchCache`，后台刷新后即时生效；初始化时若输入框已有文字立即执行一次搜索。
  - 无缓存时复用 `searching='true'` 绿色图标作为加载态；请求失败清除加载态并 `console.warn`，下次聚焦自动重试。
- `source/js/services.js`：`lazy_load: true` 时跳过页面加载时的 `searchFunc` 调用；不再在调用后覆盖 `_searchInitialized` 标记（避免 pending 状态下被提前置 true 导致不初始化）。
- `_config.yml`：`search.local_search` 新增 `lazy_load: true`、`cache_ttl: 86400`。

## 3. 影响范围

- 对外行为：默认页面加载不再下载搜索索引；搜索数据缓存按 TTL 过期，过期时后台刷新；缓存新鲜时不重复请求。
- 配置项：`search.local_search.lazy_load`、`search.local_search.cache_ttl`。
- 使用建议：站点内容较多时建议关闭懒加载（`lazy_load: false`）防止首次搜索卡顿；`cache_ttl` 建议按内容更新频率调整（默认 1 天，`0` 表示不缓存）。
- 兼容性：`lazy_load: false` 保持页面加载预取（但缓存新鲜时不重复请求）；旧 `search_cache_v1` 缓存自动作废，首次使用重新拉取。
- 需同步的知识库：`docs/knowledge/07-外部集成/search.md`、`docs/knowledge/09-高级主题/performance.md`、`docs/knowledge/知识库全量.md`，并登记 `VERIFICATION.md`。

## 4. 验证方式

- 主工程 `npm run g` 全量构建（含 `source/js` 的 Babel + terser 转译）。
- `python3 docs/knowledge/tools/verify.py` 知识库硬事实核查。
- 手工验收：页面加载无请求、聚焦才请求、缓存新鲜无请求、过期后台刷新、`cache_ttl: 0` 每次聚焦请求、断网降级、`lazy_load: false` 保持预取（见 checklist.md）。
