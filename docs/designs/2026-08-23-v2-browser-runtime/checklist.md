---
title: Stellar v2 浏览器运行时验证记录
date: 2026-08-23
---

# 生命周期与请求

- [x] Runtime manifest 是严格、深冻结的纯对象，页面只声明需要的 Extension。
- [x] Extension 支持 register、mount、unmount、重复挂载、按需 import 与失败隔离。
- [x] request/cache 支持并发去重、超时重试、TTL、stale fallback、大小限制与条目淘汰。
- [x] request/cache 不修改原生 fetch/XHR，锚点稳定器只监听客户端请求事件。
- [x] 数据服务兼容适配保持 loading、callback、已加载元素和响应 clone 语义。

# 消费链

- [x] 页面使用单一 ESM bootstrap 和 JSON manifest，不再输出解析期插件注册片段。
- [x] Search、services、comments 与内置 Feature 通过 Extension registry 按声明/DOM 条件加载。
- [x] 不存在 `document.write`、同步 utils 补载、`_pluginQueue`、`initPlugin` 或插件恢复看门狗。
- [x] DOM、CSS、URL、语言文案、公开配置与用户可见浏览器行为保持不变。

# 回归与门禁

- [x] Runtime / 模板 / 生成回归测试通过（主题 347 项测试）。
- [x] `npm run reference:check` 通过。
- [x] 主题 `npm run check` 通过。
- [x] `python3 docs/knowledge/tools/verify.py` 通过硬门禁。
- [x] 主工程 `npm run g` 通过（262 个生成文件），Wiki/Post/KaTeX 页面产物与浏览器 smoke 无 runtime error。
- [x] Standards review 无剩余 finding。
- [x] Spec review 无剩余 finding。

# 状态与边界

- [x] 主题知识库与 `VERIFICATION.md` 已同步。
- [x] 主仓库三份 v2 蓝图状态文档已同步并保持未提交。
- [x] 公共字段、公开 Wiki、URL、SEO、迁移跳转和 CSS token 变化为 N/A。
- [x] M4 标记完成；M5、Alpha 1 与首屏核心 JS gzip 30% 门禁保持未完成。
- [x] 实现提交和验证登记提交已推送 `origin/v2`，issue 由 `resolved` CI 自动关闭。
