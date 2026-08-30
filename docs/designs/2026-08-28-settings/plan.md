# 实施计划

1. 在 Theme Schema 中增加 `settings` Profile 与 `site.settings.about.items`，生成默认配置和 Reference。
2. 增加自动生成器、路由冲突检查和 `settings` 页面模板。
3. 扩展评论身份浏览器层，完成三种 Provider 的读写、退出和跨组件同步。
4. 为搜索与请求客户端增加精确缓存清理接口，并由页面 Runtime Extension 统一反馈结果。
5. 增加响应式 Profile、缓存操作和 KV Table 样式，补齐三种语言。
6. 运行定向测试、Schema 检查、F2 `npm run check` 与主工程 `npm run g`，抽查最终索引产物和移动端布局。
7. 在身份浏览器层增加共享 SHA-256 Gravatar URL 能力；设置页与 Settings Widget 保留 Provider 头像优先级，并统一按 Gravatar、站点 fallback、Profile 图标逐级降级。
8. 将 Leftbar 与 Topbar 的 Settings 图片头像缩为 28×28px，在 32px 入口中居中并固定为正圆曲率。
9. 将 Settings Widget 身份来源收敛为站点默认评论 Provider 的访客缓存，移除页面评论状态与页面 Provider 对入口身份的影响。
