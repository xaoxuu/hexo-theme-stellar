# 验收记录

## 自动化

- [x] Artalk、Waline、Twikoo 身份读取与字段映射
- [x] 保存时保留 token 和未知字段
- [x] 退出只清除当前 Provider
- [x] 损坏缓存、存储拒绝和不支持 Provider 降级
- [x] 昵称、Email、HTTP(S) URL 与头像校验
- [x] Settings 页与 Widget 的 Provider → Gravatar → 站点 fallback → Profile 图标降级
- [x] Gravatar Email 规范化、SHA-256、异步竞态与 Web Crypto 不可用降级
- [x] Leftbar 与 Topbar 的图片头像为 28×28px、四周 2px，并使用正圆 corner-shape
- [x] Settings Widget 只读取站点默认评论 Provider 缓存且不随页面状态变化
- [x] 搜索和数据缓存精确作用域
- [x] 三类缓存大小按 UTF-8 字节统计，清除后同步刷新
- [x] 缓存与 About 使用无装饰 KV 两列布局，缓存操作使用指定垃圾桶图标
- [x] 默认/自定义路由与内容页冲突
- [x] About 变量替换、未知变量保留和 URL 安全校验
- [x] About 默认内置博客框架与主题版本，自定义数组整体覆盖
- [x] About 仅图标可点击、有 URL 才渲染、图标间距 4px
- [x] Schema 生成与 `schema:check`
- [x] Theme F2 等价门禁（lint、495 tests、Schema 检查通过；性能检查使用 Node 22.23.2，降幅 37.02%）
- [x] 主工程 `npm run g`

## 构建产物

- [x] `public/settings/index.html` 存在
- [x] 页面 robots 为 `noindex,nofollow`
- [x] Sitemap 不包含 settings URL
- [x] `search.json` 不包含 settings URL
- [x] Feed 不包含 settings URL
- [x] 桌面与 390×844 视口无横向溢出
- [x] About 图标有 hover/focus 状态，点击区域为 32×32px
