# 动态数据缓存

> 日期：2026-08-09 | 作者：xaoxuu | 版本：v1.36.0 | 关联 Issue：[#656](https://github.com/xaoxuu/hexo-theme-stellar/issues/656)

## 背景

站点动态数据（友链、时间线、最新评论、Memos、RSS、GitHub 信息、卡片链接等）每次访问页面都会重新请求外部 API，导致：

- 页面加载慢，尤其是首屏依赖动态数据填充的区域
- 外部 API 请求量大，容易触发限流或故障
- 卡片链接（siteinfo）场景每张卡片都打一次接口，成本最高

目标：把动态数据缓存到浏览器本地，下次访问时 TTL 未过期直接显示缓存（不发请求），过期后先显示缓存、再后台刷新并写回缓存（stale-while-revalidate）。

## 方案

### 缓存层（`layout/_partial/scripts/utils.ejs`）

所有动态数据服务统一走 `utils.request(el, url, callback, onFailure)`，在入口处新增缓存层即可覆盖绝大多数服务，无需逐个修改服务回调。

- 缓存 key：`Stellar.data_cache.v1.` + 完整 URL（带版本前缀，便于日后失效旧数据）
- 条目结构：`{ text, contentType, ts, ttl }`
- TTL：从 `def.data_cache` 读取；按服务覆盖（根据元素 `ds-*` 类名或 `options.service` 识别服务），未配置的服务用 `default_ttl`
- 容量保护：单条目上限 200KB；总条目上限 `max_entries`（默认 200）；写入失败（配额/序列化异常）时按 `ts` 淘汰最旧条目重试一次，仍失败则本次会话静默禁用并 `console.warn`
- 缓存命中重建 `Response` 对象，各服务回调里的 `resp.json() / resp.text()` 无需改动
- 重复渲染处理：缓存渲染前快照元素初始结构（`el.innerHTML`），后台刷新渲染前恢复该结构，append 型服务不会重复渲染
- 后台刷新失败：保留已渲染的缓存内容，不触发失败 UI（仅 `console.warn`）

### 不缓存的场景

- `mdrender`（URL 带 `?t=` 时间戳缓存破坏参数，正则 `/[?&]t=\d{10,}/` 跳过）
- vote / rating 的读写请求（交互型数据，v1 不缓存）
- twikoo（POST 接口）、memos 用户详情 fetch、local-search（已有独立缓存）、download-file（二进制）
- `utils.request` / `requestWithoutLoading` 传入 `cache: false` 或 fetch `cache: 'no-store'` 的请求

## 改动清单

### 新增文件（1 个）

| 文件 | 说明 |
|------|------|
| `docs/designs/2026-08-09-dynamic-data-cache.md` | 本设计文档 |

### 修改文件（4 个）

| 文件 | 改动内容 |
|------|---------|
| `layout/_partial/scripts/utils.ejs` | 新增 `utils.cache`（读写/容量/TTL/重建 Response）；`utils.request` 集成 stale-while-revalidate；`requestWithoutLoading` 同步接入 |
| `layout/_partial/scripts/defines.ejs` | `def` 注入 `data_cache` 配置 |
| `_config.yml` | 新增 `data_cache` 配置块（enable / default_ttl / ttl / max_entries） |
| `source/js/services/siteinfo.js` | cardlink 请求从直接 `fetch` 迁移到 `utils.request`，复用缓存 |

## 配置

```yaml
data_cache:
  enable: true # 总开关
  default_ttl: 3600 # 默认缓存时长（秒）
  ttl: # 按服务覆盖缓存时长（秒），未列出的服务使用 default_ttl；设为 0 表示该服务不缓存
    giscus: 600
    waline: 600
    artalk: 600
    memos: 600
    sites: 86400
    friends: 86400
    friends_and_posts: 86400
    siteinfo: 86400
  max_entries: 200 # 本地缓存条目上限，超出后按写入时间淘汰最旧的
```

## 执行计划

1. `utils.ejs`：实现 `utils.cache` 与 `utils.request` / `requestWithoutLoading` 集成
2. `defines.ejs`：注入 `def.data_cache`
3. `_config.yml`：新增默认配置
4. `siteinfo.js`：迁移 cardlink 请求
5. 全量验证：`npm run g && npx gulp minify`
6. 本地预览验证各场景（见测试记录）

## 测试记录

### 全量构建

- [x] `npm run g && npx gulp minify` 通过

### 场景用例

- [x] 首次访问：正常请求并写缓存，渲染一次
- [x] TTL 内二次访问：无网络请求，内容来自缓存且无重复
- [x] TTL 过期后访问：缓存先渲染，后台刷新完成后内容替换且不重复（append 型服务 + 异步 append 的 memos）
- [x] 刷新失败：保留缓存内容，不出现错误图标
- [x] mdrender：每次访问仍拉取最新，localStorage 不增长
- [x] cardlink：走统一入口缓存（TTL 内二次访问不再打 API）
- [x] 配额/超大响应：写入失败不影响渲染
- [x] 关闭 `enable` 后行为与改动前一致（`enable: false` 时 `shouldCache` 返回 false）
- [x] 旧缓存数据解析失败时自动回退为 miss

> 说明：浏览器端功能逻辑通过 Node 对 `utils.ejs` 实际代码的 10 项用例验证（mock localStorage/fetch/Response，覆盖缓存命中、过期刷新去重、失败降级、mdrender 绕过、服务级 TTL、配额淘汰、条目上限、损坏数据回退、requestWithoutLoading）；本地 `npm run s` 冒烟验证了首页、友链页、Wiki 页等含 `ds-*` 服务的页面正常渲染。
