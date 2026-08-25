---
title: Stellar v2 自部署服务默认 endpoint 与静默降级
date: 2026-08-25
status: 实施中
issue: 730
---

# 问题与目标

`extensions.services.site_info/rating/vote.endpoint` 当前默认均为 `null`，Rating 与 Vote 标签在 endpoint 为空时还会中止构建。站点必须先理解并部署服务，才能使用主题已有的数据服务能力；公共服务暂时不可用时，浏览器还可能输出控制台错误或未处理 Promise。

本切片为三项服务提供 xaox.cc 公共默认实例，并建立确定性静默降级：空配置可以直接使用；自定义绝对 HTTP(S) URL 继续覆盖默认值；显式 `null` 关闭服务；远程失败保留静态内容，不向页面或控制台报错。

# 公开契约

- `extensions.services.site_info.endpoint` 默认 `https://api.xaox.cc/site_info/v1?url={href}`。
- `extensions.services.rating.endpoint` 默认 `https://star-vote.xaox.cc/api/rating`。
- `extensions.services.vote.endpoint` 默认 `https://star-vote.xaox.cc/api/vote`。
- 三个字段继续接受绝对 HTTP(S) URL 或 `null`；非法 URL 仍由声明式 Schema 拒绝。
- `null` 不回退公共实例：Site Info 保留原始卡片内容，Rating/Vote 输出不可交互的静态标签。

# 技术方案

- 复用既有 `extensions.services` Schema、Runtime Manifest、内部服务资源注册表与 request/cache 客户端，不增加公开字段或第二套服务注册。
- 主题默认配置、声明式 Schema 与配置目标元数据使用同一组 endpoint 默认值，并重新生成配置 Reference。
- Rating/Vote 标签仅在 endpoint 存在时输出 `data-api`；关闭时增加禁用状态和原生 `disabled` 按钮，不再抛出构建异常。
- Site Info 捕获统一请求入口的网络/HTTP/解析失败；Rating/Vote 对非 2xx 和解析失败按请求失败处理。加载失败保留初始内容，提交失败撤销本地乐观状态，所有预期远程失败均静默。
- 非法配置、Extension 资源加载和程序错误不属于静默范围，继续使用现有诊断链路。

# 影响范围

- 主题：默认配置、配置 Schema/Reference、Rating/Vote 标签与样式、Site Info/Rating/Vote 浏览器服务、测试和数据服务知识库。
- 主工程：Stellar v2 总蓝图补记 M6 契约修正；公开 Wiki 说明默认公共实例、覆盖、关闭和失败降级。
- GitHub API/Raw/Gist、GitHub Card 和其它数据服务保持不变；不新增依赖，不改变 URL、SEO 或其它 Extension 生命周期。

# 验收

- 配置测试覆盖默认、自定义、显式 `null` 与非法 URL。
- 标签测试覆盖默认 markup 与 `null` 静态禁用态。
- 浏览器测试覆盖离线、非 2xx、无效 JSON、成功响应与提交回滚，且无控制台输出或未处理 rejection。
- 主题 `npm run check`、知识库核查、主工程 `npm run g` 与差异检查通过。
