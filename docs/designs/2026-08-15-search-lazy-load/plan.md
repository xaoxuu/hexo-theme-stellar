---
title: 本地搜索懒加载与缓存 TTL 执行计划
date: 2026-08-15
---

# 执行计划

## 实施步骤

1. [x] `_config.yml` 新增 `lazy_load` / `cache_ttl`
2. [x] `local_search.ejs` 把配置合并到 `ctx.search`
3. [x] 重构 `local-search.js`（v2 缓存 + TTL + 懒加载 + focusin 委托）
4. [x] `services.js` 懒加载模式跳过页面加载初始化
5. [x] 知识库与 `VERIFICATION.md` 同步
6. [x] 验证：`verify.py` + 主工程 `npm run g`

## 风险与回退

- 风险：首次聚焦无缓存时有网络等待 → 用绿色加载态 + 缓存优先缓解；请求失败可再次聚焦重试。
- 回退：`lazy_load: false` 恢复页面加载预取；`cache_ttl: 0` 恢复每次请求。
