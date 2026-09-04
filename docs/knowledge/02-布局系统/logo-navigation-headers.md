---
title: Brand、导航与页头
domain: 布局系统
tags:
  - brand
  - navigation
  - topbar
---

# Brand、导航与页头

Stellar v2 让 Region 自己拥有它的 Brand 和 Menu。Topbar 与 Leftbar 内容彻底独立，不存在根级 Brand 或 Menu 的跨栏回退；`spacer` 在 Topbar 中显式分配剩余空间。

## Brand 数据

```yaml
leftbar:
  brand:
    image:
      src: /avatar.webp
      variant: avatar # avatar | icon | plain
    name: Stellar
    tagline: 每个人的独立博客
    href: /
```

Topbar 需要自己配置一份完整 Brand：

```yaml
topbar:
  brand:
    image:
      src: /logo.svg
      variant: plain
    name: Stellar Docs
    tagline: 主题文档
    href: /wiki/stellar/
```

`image` 支持 `src` 与 `variant`，`variant` 区分正圆裁剪的头像、完整容纳的图标和不裁剪的透明字标。Brand 可以为 `false` 整体隐藏；对象内字段按层合并，`null` 显式隐藏对应内容。Wiki 与 Notebook 默认从 Collection 的 `name/tagline/icon/route` 生成 Leftbar Brand；显式 Profile、Collection 或 Page Brand 仍按层覆盖。Topic 不生成 Collection Brand，继续继承站点 Brand。

## Menu 数据与激活

```yaml
leftbar:
  menu:
    - id: post
      title: 博客
      icon: default:documents
      url: /
      accent: '#1BCDFC'
```

页面 Profile 的 `active_menu` 提供默认激活 ID，Collection/Page 使用同名根字段 `active_menu` 覆盖。该 ID 会分别匹配 Topbar 与 Leftbar Menu；Profile 校验使用两份菜单 ID 的并集。

## 显示位置

Topbar-only：

```yaml
topbar:
  enabled: true
  brand:
    name: Stellar
  menu: []
  widgets: [spacer, menu, settings]
leftbar:
  enabled: false
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

文档站可同时保留 Topbar 和 Leftbar；二者不互斥。Topbar Brand 是 Widget 栈之前的固定槽位，Menu 只在 Topbar 已启用、菜单非空且 `widgets` 含 `menu` 时渲染。Leftbar Brand 与 Menu 都是固定槽位。

位置能力、折叠 Rail 和 Drawer 行为见 [Region 与 Leftbar 系统](sidebar-system.md)。

## 移动端

平板先将 Rightbar 作为 Drawer，手机再把 Leftbar 与 Rightbar 都作为 Drawer；Topbar 可继续存在。Drawer 按钮同步 `aria-expanded`，Escape 关闭并恢复焦点。Brand、Menu、Search、Actions 均支持 Drawer presentation。

## 实现边界

- Brand 解析：`scripts/helpers/brand.js`
- 菜单数据：Region `menu` Schema 与 `layout/_partial/sidebar/menu.ejs`
- 系统 Widget：`scripts/lib/widget-registry.js`
- Region 渲染：`layout/_partial/regions/widgets.ejs`
- 页面模型：`scripts/lib/models/index.js`
