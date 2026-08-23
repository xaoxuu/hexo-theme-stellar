---
title: Stellar v2 浏览器运行时
date: 2026-08-23
status: 已完成
---

# 目标

完成 Pre-alpha M4：用原生 ESM 建立可测试的 Extension 注册表、`mount(root, context)` / `unmount(root)` 生命周期和统一 request/cache 客户端，替换解析期插件注册与网络状态 monkey patch，同时保持现有 DOM、CSS、URL、语言文案和用户可见浏览器行为。

# 用户结果

- 页面只动态导入声明且命中当前 DOM 条件的 Extension；单个 Extension 加载或挂载失败不会阻止其他能力和正文显示。
- 每个挂载根都有独立生命周期；重复 mount 会先释放旧实例，unmount 按逆序执行清理。
- 数据服务通过同一 request/cache 客户端获得并发去重、超时重试、TTL、stale fallback 与条目淘汰，不修改浏览器原生 `fetch` 或 `XMLHttpRequest`。
- 启动链不再使用 `document.write`、同步 utils 补载、`_pluginQueue`、`initPlugin` 或插件恢复看门狗。

# 契约与实现

## 复用入口与边界

- 复用 M1.5 已冻结的 `extensions.search/comments/features/services/cache` 公开配置、`extension-assets.js` 内部资源表、现有 EJS 页面判定、`utils.css/js` 的兼容资源加载和数据服务 DOM 标记。
- 不新增公开 YAML、Front Matter、URL、CSS token、语言文案或客户端公开 API；如需改变 `extensions` 字段，必须重新打开 M1.5 门禁，本切片禁止这样做。
- `utils`、`ctx`、`util`、`hud` 仍是迁移期核心脚本的兼容表面；M4 删除裸全局“注册与网络控制权”，而不是把尚未进入模块边界的整个 v1 核心同时重写。

## Runtime Manifest

- `browser_runtime_manifest()` 接收冻结的 Extension 配置投影、内部资源、页面 render/profile 和评论 ViewModel，输出深冻结的纯对象 manifest。
- manifest 只包含 `version/root/cache/dependencies/extensions`。每个 Extension 声明 `id/module/config`，可选 `when.selector` 或 `when.always`；未知字段、重复 ID、非法模块路径和非法条件在生成期失败。
- `#stellar-runtime-config` 以 `application/json` 注入，`/js/runtime/index.mjs` 是唯一运行时入口。JSON 序列化转义 `<`、`>`、`&` 和行分隔符，不能形成可执行 HTML。

## ExtensionRegistry

- `createExtensionRegistry({ importer, onError })` 是模块内工厂；`register()` 只接收合法声明并拒绝重复 ID。
- `mount(root, context)` 根据 `when` 判定后逐项 `import()`，调用模块的 `mount(root, extensionContext)`；返回函数或 `{ cleanup }` 均登记为实例清理。
- `unmount(root)` 逆序执行清理；重复 mount 先 unmount。同一个 Extension 的 import Promise 在注册表内复用，但不同 root 的实例状态隔离。
- import、mount 和 cleanup 错误均转为结构化结果与 `stellar:extension-error` 事件，不向外抛出打断后续 Extension。

## RequestCacheClient

- `createRequestClient(options)` 接收 `fetch/storage/cache/clock/scheduler/dispatch` 依赖，默认使用浏览器原生能力，便于 Node 单测替换。
- `request(url, options)` 支持 GET 缓存、按 service TTL、同 method+URL 并发去重、超时与有限重试；fresh 命中不联网，stale 先作为失败 fallback，成功响应异步回写。
- 缓存键前缀固定为 `Stellar.request-cache.v2.`；单条正文上限 200 KiB，超限不写；`maxEntries` 按最旧时间淘汰。非 GET、`cache: false/no-store` 和时间戳破坏参数不缓存。
- 客户端在请求开始/结束时派发 `stellar:request-start` / `stellar:request-end`；锚点稳定逻辑只监听事件，不替换 `fetch` / XHR 原型。
- 迁移期 `utils.request` / `utils.requestWithoutLoading` 由 runtime 安装薄适配器，保留数据服务的 loading、callback 和已加载元素语义；runtime 执行前的调用通过同步建立的 Promise bridge 排队，缓存与网络算法只有模块客户端一份。

## 内置 Extension

- `search`、`services`、`comments`、`features` 使用随主题发布的 ESM adapter；adapter 通过 runtime asset loader 按 DOM/配置加载当前内部脚本或第三方 provider。
- Feature adapter 覆盖 preload、lazy loading、lightbox、reveal、AI summary、MathJax、diagrams、code copy、adaptive text、card hover、CJK typography 与 Swiper；KaTeX 仍是服务端渲染配套 CSS，不建立无意义的浏览器 mount。
- 现有 provider/服务脚本保持 DOM 输出和外部库参数不变。adapter 必须返回可执行清理，无法撤销的第三方全局只停止本实例后续工作并释放主题创建的监听器、observer、timer 或组件实例。
- Registry 隔离每个 root 的实例，search、comments、Fancybox 与 adaptive text 等 adapter 使用 root-scoped listener/state。仍依赖第三方全局选择器/自动初始化的 lazy-loading 与 AI summary，以及由 v1 经典服务脚本实现的 data-service，是明确的 document-root 兼容 adapter并拒绝 element root，避免共享脚本缓存造成伪隔离。M4 页面 runtime 只在 document 挂载这些 adapter；把它们改为独立组件 mount 不属于本切片。

# 新增定义

- `RUNTIME_VERSION`：manifest 结构版本；作用域为生成期校验与浏览器解析；默认 `1`；内部常量，不进入公开配置。
- `RUNTIME_CONFIG_ID`：JSON script DOM ID；仅 runtime bootstrap 消费；默认 `stellar-runtime-config`；内部常量。
- `REQUEST_CACHE_PREFIX`：v2 缓存命名空间；仅 request/cache client 消费；默认 `Stellar.request-cache.v2.`；不兼容读取 v1 缓存。
- `MAX_CACHE_ENTRY_BYTES`：单条响应正文写入上限；仅客户端缓存保护消费；默认 `204800`；内部常量。
- `stellar:extension-error`：Extension import/mount/unmount 的失败隔离事件；detail 含 `id/phase/error`；只用于诊断，不承诺跨大版本公共 API。
- `stellar:request-start/end`：主题请求客户端的活动事件；detail 含请求 key；只供锚点稳定器和诊断消费，不代理第三方直接网络请求。

# 影响范围

- 主题：新增 runtime manifest builder/helper、ESM registry/request/asset/adapter、生命周期与生成消费测试；重写 scripts/plugin/comment/service 启动链并同步前端交互、插件、数据服务知识库和 `VERIFICATION.md`。
- 主仓库：只同步 `docs/specs/stellar-v2-blueprint/{spec,plan,checklist}.md`，保持未提交；不改 `source/`，不提交或推送主仓库，不更新 v2 子模块指针。
- 公开 Wiki、迁移/SEO 跳转、产品路由和 M5 Reference：N/A。

# 验收

- manifest Schema/冻结/页面选择、Extension register/mount/unmount/on-demand import/重复挂载/失败隔离、request/cache 优先级/去重/TTL/stale/淘汰/禁用路径均有可执行测试。
- 迁移模板不再输出 `document.write`、`_pluginQueue`、`initPlugin` 或 fetch/XHR 赋值；非法或缺失 manifest 时安全降级为 `sr-fallback` 并保留正文。
- `/wiki/`、Wiki 标签页、Wiki 首页与内页、Topic、Notebook、普通 Post 和搜索/评论/动态服务生成结果抽查保持 DOM、资源条件和配置不变。
- `npm run reference:check`、主题 `npm run check`、知识库核查和主工程 `npm run g` 通过；Standards / Spec 双轨 review 无剩余 finding。
- M4 完成后 M5 与 Alpha 1 仍保持未完成；首屏核心 JS gzip 30% 是 Alpha 集成性能门禁，本切片记录基线但不以局部结果提前勾选 Alpha。
