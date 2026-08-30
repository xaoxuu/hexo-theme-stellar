# 设置页

## 目标

Stellar 始终生成一个仅供当前浏览器使用的设置页。默认路由为 `/settings/`，Settings Widget 整体链接到该页。页面只读取浏览器中评论 Provider 已有的身份缓存，不把个人数据写进静态 HTML，也不调用评论服务端资料 API。

页面固定包含 Profile、Settings、About 三个区块，并输出 `noindex,nofollow`。生成路由不进入 Hexo 页面集合，因此不会进入搜索、Feed 或 Sitemap；生成数据同时显式声明 `sitemap: false`、`feed: false` 与 `search: false`。

## 配置契约

```yaml
layout:
  profiles:
    settings:
      path: /settings/
      navigation:
        active_menu: null

site:
  settings:
    about:
      items:
        - key: 博客框架
          value: Hexo {hexo.version}
          url: https://hexo.io/
        - key: 主题版本
          value: Stellar {theme.version}
          url: '{theme.tree}'
```

`about.items` 默认内置博客框架与主题版本两项。博主显式配置数组时整体覆盖默认列表，也可以配置空数组隐藏全部 About 项。每项必须有纯文本 `key`、`value`，`url` 可选。`value` 与 `url` 支持 `{hexo.name}`、`{hexo.version}`、`{hexo.homepage}`、`{theme.name}`、`{theme.version}`、`{theme.tree}`；未知变量保留原文，随后按文本或 URL 属性上下文转义。

About 与缓存区复用无边框、无底色、无分隔线的简约 KV 两列布局。About 行本身及 value 不可点击。只有配置了 `url` 的项目会在 value 后以 4px 间距渲染 `default:link` 图标链接。外部链接使用新窗口和 `external nofollow noopener noreferrer`，内部链接保留当前站点 root。

配置路径与已有内容页冲突时，生成器中止构建并指出冲突来源。

## 身份边界

- Artalk：读取和更新 `ArtalkUser` 的 `name/email/link`。
- Waline：优先读取登录态 `WALINE_USER`，否则读取 `WALINE_USER_META`；登录态映射 `display_name/email/url`，评论元数据映射 `nick/mail/link`。
- Twikoo：读取和更新 `twikoo` 的 `nick/mail/link`。
- 保存采用对象合并，保留 token 和未知字段；同一 Provider 在 localStorage/sessionStorage 中已有的 Waline 副本都会同步更新。
- 退出只删除当前 Provider 的身份、元数据和 token。
- Giscus、Utterances、Beaudar 及未知 Provider 不由主题管理，只显示说明，不输出编辑或退出控件。
- 头像按 `Provider avatar → Email Gravatar → resources.fallbacks.avatar → default:profile` 降级。合法且可加载的 Provider 头像始终优先；仅在其缺失、非法或加载失败时，将规范化 Email（去除首尾空白并转小写）以 SHA-256 哈希后请求 `https://gravatar.com/avatar/{hash}?s={size}&r=g&d=404`。设置页请求 160px，Settings Widget 请求 64px；Gravatar 404、网络失败或 Web Crypto 不可用时继续降级，不把生成 URL 写回 Provider 缓存。
- Settings Widget 的身份来源固定为站点默认 `extensions.comments.provider` 对应的浏览器访客缓存，不读取页面 ViewModel、页面级评论 Provider，也不判断当前页是否渲染评论区。默认 Provider 受支持且缓存中存在有效昵称时显示身份与头像；否则保持默认 Settings 状态且不根据 Email 请求 Gravatar。
- Leftbar 与 Topbar 中的 Settings Widget 保持 32×32px 入口；显示图片头像时图片为 28×28px，在入口四周各留 2px，并以 `border-radius: 50%` 与 `corner-shape: round` 保持正圆。默认 Settings/Profile 图标尺寸不变。
- 保存后派发 `stellar:profile-change` 同步当前页和侧边栏；其他标签页使用原生 `storage` 事件同步。评论区下次挂载时读取相同 Provider 缓存。

## 缓存边界

- 搜索缓存：只删除 `search_cache_v4`，并清空本页已加载的搜索内存索引、缓存条目和单飞 Promise。
- 数据缓存：只删除 `Stellar.request-cache.v2.*`。
- 全部缓存：以上两类的并集。
- 页面按 Local Storage 中对应键和值的 UTF-8 字节数显示搜索缓存、数据缓存和两者并集；清除后立即刷新大小，存储不可用时显示 `—`。
- 三行右侧只通过 `default:trash` 图标按钮执行对应清理操作。
- KV 链接与缓存操作复用同一套 32px 圆形图标控件样式；清理成功时保持静默，部分失败或失败时才显示结果。
- 不删除评论身份、配色、侧栏状态或其它站点数据。
- 浏览器存储不可用或只完成部分删除时，页面保持可操作并分别显示成功、部分失败或失败。

## 交付边界

本功能同步 Theme Schema、生成默认配置和公开 Reference。普通开发阶段不更新知识库、Wiki、CHANGELOG 或版本验证文档。
