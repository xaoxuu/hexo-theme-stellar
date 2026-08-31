---
title: Region 与 Leftbar 系统
domain: 布局系统
tags:
  - region
  - leftbar
  - rightbar
  - widget
---

# Region 与 Leftbar 系统

Stellar v2 的公开 Region 是 `topbar`、`leftbar`、`rightbar`。名称直接对应桌面位置；响应式只改变 presentation，不改变 Region 身份。三者可以全部省略、单独存在或同时存在。

## 配置形态

三个 Region 只接受对象；Widget 数组统一位于 `widgets`：

```yaml
topbar:
  widgets: [site_brand, spacer, menu, settings, actions]
leftbar:
  default_state: expanded
  enabled: true
  brand: site_brand
  menu: true
  footer_actions: true
  widgets: []
rightbar:
  widgets: [toc]
```

省略 Region 或 `widgets` 表示继续继承；需要显式清空上层 Widget 时使用空数组：

```yaml
leftbar:
  widgets: []
```

`leftbar.default_state: expanded | collapsed` 只允许站点级 `leftbar` 使用。

## 四层级联

最终 Widget 按以下顺序解析：

1. 站点全局 `topbar/leftbar/rightbar`
2. `profiles.<profile>.topbar/leftbar/rightbar`
3. Collection YAML 的 `topbar/leftbar/rightbar`
4. Page Front Matter 的 `topbar/leftbar/rightbar`

每个 Region 的最后一个显式 `widgets` 数组整体替换上层数组；空数组清空，省略字段继承。解析器不去重、不排序，也不把不支持的 Widget 自动搬到其它 Region。Notebook 的 `note_defaults.topbar/leftbar/rightbar` 使用同一规则。

## 系统 Widget

以下站点元素进入统一 Widget Catalog：

| Widget | 业务数据来源 |
| --- | --- |
| `site_brand` / `collection_brand` | 根级 `brand` 与 Collection Identity 投影 |
| `menu` | 根级 `menu` 与最终导航状态；搜索入口复用 Menu search item |
| `actions` | 根级 `footer.actions` |
| `settings` | 外观设置入口 |
| `spacer` | Topbar 弹性占位；多个实例平分剩余空间 |

移动 Widget 只改变位置，不复制业务配置。Topbar-only 站点可以直接把系统 Widget 放入 Topbar，并在需要覆盖 Leftbar Widget 的 Profile 中使用 `widgets: []` 清空。

## Presentation 能力

Widget 类型声明 `topbar`、`leftbar`、`leftbarRail`、`rightbar`、`drawer` 能力：

| 类型 | Topbar | Leftbar | Rail | Rightbar | Drawer |
| --- | :---: | :---: | :---: | :---: | :---: |
| Brand / Menu / Actions / Settings | ✓ | ✓ | ✓ |  | ✓ |
| Spacer | ✓ |  |  |  |  |
| TOC | ✓ | ✓ | ✓ | ✓ | ✓ |
| Tree / Tagtree |  | ✓ | ✓ | ✓ | ✓ |
| Recent / Related / GitHub / Author |  | ✓ |  | ✓ | ✓ |
| Timeline / Markdown |  | ✓ |  | ✓ | ✓ |

未声明能力的自定义 Widget 默认只支持 Leftbar、Rightbar 和 Drawer。实例不能用内联 `presentations` 扩大类型能力，也不存在万能 Topbar Popover 回退。

不支持的位置产生 `unsupported_widget_presentation` warning，包含 Widget、layout、目标 Region、Profile 和支持列表。实例会被跳过；跳过后 Region 为空则不输出 DOM。仅有此类 warning 时 Doctor 的 `ok` 仍为 `true`。

## Leftbar 内部分区与 Rail

Leftbar 不公开第二套槽位配置。Brand、Menu、Footer Actions 与 Settings 由 Leftbar 固定槽位承载，`widgets` 中的普通内容 Widget 按原数组顺序进入中间独立滚动区。系统控制栏始终存在；Leftbar 不存在时不生成控制栏。

桌面 Leftbar 支持 `expanded` 与 `collapsed`。折叠态只显示支持 `leftbarRail` 的 Widget；Timeline、Markdown 等 Panel-only Widget 隐藏到重新展开。

状态保存在版本化键 `stellar:v2:leftbar-state`，并由 `<head>` 中的首屏脚本在布局计算前恢复。旧 Sidebar 状态键不迁移。Rail 使用实际 64px 宽度；Visitor 只显示头像，折叠/展开按钮位于其下方，临时 Drawer 中恢复头像和昵称。

在 `≤768px` 时 Leftbar 攟为 Drawer，不保留永久 Rail。

## Rightbar 与 Drawer

Rightbar 在 `>1180px` 是 Shell 约束的固定高度 Sticky 面板，内部独立滚动；桌面 Viewport 透明，背景、边框与模糊由内部 Widget 自己消费 Appearance Token，TOC 不再创建第二层 Sticky。`769–1180px` 时 Rightbar 先转为带完整 Appearance 表面的 Drawer、Leftbar 自动转为 Rail；`≤768px` 时两个侧栏都进入互斥 Drawer。

Wiki Profile 的 Topbar、Leftbar、Rightbar 同样使用 Region 对象；Collection Brand 由 Leftbar 固定 `brand` 槽位读取，内容 Widget 顺序仍由 `widgets` 数组决定。

Drawer 复用原 Region 节点并遵守 ARIA、焦点转移、Escape、焦点恢复、`inert` 与 reduced-motion 契约。

## 与其它维度正交

- `appearance.preset: card | glass | minimal | flat` 只决定视觉 Token。
- Examples Blueprint 是完整站点起点，不参与主题运行时继承。

首页固定使用标准文章 Feed；切换 Appearance 不会改变 Region DOM。

## 迁移

预发布旧名不保留运行时别名：

| 旧字段/能力 | 新字段/能力 |
| --- | --- |
| `regions.topbar/leftbar/rightbar` | 顶层 `topbar/leftbar/rightbar` |
| `note_defaults.regions.*` | `note_defaults.topbar/leftbar/rightbar` |
| `topbar: [a, b]` | `topbar.widgets: [a, b]` |
| `rightbar: [a, b]` | `rightbar.widgets: [a, b]` |
| `sidebarRail` | `leftbarRail` |
| `appearance.backgrounds` 下的旧键 `sidebar` | `leftbar` |
| v1 `sidebar.left.widgets` | `leftbar.widgets` |
| v1 `sidebar.right.widgets` | `rightbar.widgets` |
| `sidebar.left.brand` | 业务数据放入 `brand`，Region 放置 `brand` |
| `sidebar.left.search/menu/wiki_home` | 在目标 Region 的 `widgets` 中放置系统 Widget |
| 旧 Sidebar 的独立 `surface` | `appearance.preset` |

Doctor 会直接拒绝旧字段并给出精确迁移目标。

实现入口：`scripts/lib/regions.js`、`scripts/lib/widget-registry.js`、`scripts/lib/doctor.js`、`layout/_partial/regions/widgets.ejs`、`source/js/main.js`。
