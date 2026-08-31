---
title: 错误页
domain: 内容系统
---

# 错误页

`layout/404.ejs` 渲染独立的 404 内容：错误插图、三语说明与返回首页按钮。模板将 `page.robots` 设为 `none`，并通过 `page.comments = {enabled: false, title: ''}` 显式关闭评论。

## 配置

```yaml
profiles:
  error:
    path: /404.html
    active_menu: post
    leftbar:
      widgets: [recent]
    rightbar:
      widgets: []

error_page:
  image: https://example.com/404.svg
```

- `profiles.error.path` 决定生成路径。
- `active_menu` 与三个 Region 对象决定 Shell 布局。
- `error_page.image` 提供可空插图，冻结运行时键为 `errorPage.image`；设为 `null` 时不渲染图片。

错误页不读取全局评论 provider，也不通过空标题间接隐藏评论。404 canonical 由 head 层明确跳过，`robots: none` 保持 Hexo 页面字段语义。

## 本地化

模板通过 `__()` 消费 `page.error.what`、`page.error.why` 和 `page.error.action`，站点无需配置这些界面文案。

## 参考源码

- [layout/404.ejs](../../../layout/404.ejs)
- [_config.yml](../../../_config.yml)（`profiles.error`、`error_page.image`）
- [评论系统](../07-外部集成/comment-systems.md)
