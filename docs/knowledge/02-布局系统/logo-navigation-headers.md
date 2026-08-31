---
title: Brand、导航与页头
domain: 布局系统
tags:
  - brand
  - navigation
  - topbar
---

# Brand、导航与页头

Stellar v2 把站点身份、菜单数据与显示位置分离：`brand` 和 `menu` 保存业务数据，`brand`、`menu`、`search`、`actions` 系统 Widget 决定它们出现在哪个 Region；`spacer` 在 Topbar 中显式分配剩余空间。

## Brand 数据

```yaml
brand:
  image:
    src: /avatar.webp
    variant: avatar # avatar | icon | plain
  name: Stellar
  tagline: 每个人的独立博客
```

`image` 是原子对象；`variant` 明确区分正圆裁剪的头像、完整容纳的图标和不裁剪的透明字标。站点 Brand 点击后返回站点首页，Collection Brand 点击后返回对应 Collection 首页。

Wiki 与 Notebook 可由 Collection 的 `identity.icon`、`name`、`tagline` 和路由生成默认 Brand；缺少图标时使用项目图兜底，不会从 Card Cover 或 Hero 背景猜测。Topic 默认使用站点 Brand。

Collection 与 Page 不再维护一份位置绑定的 Brand 覆盖。它们只在目标 Region 放置 `brand` Widget；业务身份仍归 `brand` 与 Collection Identity 所有。

## Menu 数据与激活

```yaml
menu:
  items:
    - id: post
      title: 博客
      icon: default:documents
      url: /
      accent: '#1BCDFC'
```

页面 Profile 的 `active_menu` 提供默认激活 ID，Collection/Page 的 `navigation.menu` 可覆盖。最终值在 PageViewModel 中冻结，`menu` Widget 无论位于 Topbar、Leftbar 还是 Drawer 都读取同一投影。

## 显示位置

Topbar-only：

```yaml
topbar:
  widgets: [site_brand, spacer, menu, settings, actions]
leftbar:
  widgets: []
profiles:
  home:
    leftbar:
      widgets: []
  blog_index:
    leftbar:
      widgets: []
```

Profile 省略 `widgets` 时继承上层数组，显式 `widgets: []` 时清空。

经典 Leftbar：

```yaml
leftbar:
  widgets: [recent]
```

文档站可同时保留 Topbar 和 Leftbar；二者不再互斥。Topbar 内部不再为 Brand 隐式添加自动外边距，Widget 的顺序和多个 Spacer 会直接决定真实布局。Wiki 返回入口由 Collection Brand partial 承载。

位置能力、折叠 Rail 和 Drawer 行为见 [Region 与 Leftbar 系统](sidebar-system.md)。

## 移动端

平板先将 Rightbar 作为 Drawer，手机再把 Leftbar 与 Rightbar 都作为 Drawer；Topbar 可继续存在。Drawer 按钮同步 `aria-expanded`，Escape 关闭并恢复焦点。Brand、Menu、Search、Actions 均支持 Drawer presentation。

## 实现边界

- Brand 解析：`scripts/lib/brand.js`、`scripts/helpers/brand.js`
- 菜单数据：根级 `menu` Schema 与 `layout/_partial/sidebar/menu.ejs`
- 系统 Widget：`scripts/lib/widget-registry.js`
- Region 渲染：`layout/_partial/regions/widgets.ejs`
- 页面模型：`scripts/lib/models/index.js`
