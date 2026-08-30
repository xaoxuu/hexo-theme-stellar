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

Region 接受三种输入：

```yaml
layout:
  regions:
    topbar: [brand, spacer, menu, search, visitor, actions] # 数组简写
    leftbar:                              # 空键等同未配置
    rightbar:
      widgets: [toc]                     # 完整对象
```

对象中的空子字段也等同未配置。需要显式清空上层 Widget 时，使用 `inherit: false` 和空数组：

```yaml
regions:
  leftbar:
    inherit: false
    widgets: []
```

`leftbar.default_state: expanded | collapsed` 只允许站点级 `layout.regions.leftbar` 使用。

## 四层级联

最终 Widget 按以下顺序解析：

1. 站点全局 `layout.regions`
2. `layout.profiles.<profile>.regions`
3. Collection YAML 的 `regions`
4. Page Front Matter 的 `regions`

每层默认 `inherit: true`，按声明顺序追加；`inherit: false` 先清空此前结果。解析器不去重、不排序，也不把不支持的 Widget 自动搬到其它 Region。Notebook 的 `note_defaults.regions` 使用同一规则。

## 系统 Widget

以下站点元素进入统一 Widget Catalog：

| Widget | 业务数据来源 |
| --- | --- |
| `brand` | `site.brand` 与 Collection Identity 投影 |
| `menu` | `site.menu` 与最终导航状态 |
| `search` | `extensions.search` 与页面搜索范围 |
| `actions` | `site.footer.actions` |
| `visitor` | 当前页面评论 Provider 的本地身份缓存；只投影昵称和合法头像 |
| `wiki_home` | Wiki 索引路径 |
| `spacer` | Topbar 弹性占位；多个实例平分剩余空间 |

移动 Widget 只改变位置，不复制业务配置。Topbar-only 站点可以直接把系统 Widget 放入 Topbar，并在会追加 Leftbar Widget 的 Profile 中用 `inherit: false` 清空。

## Presentation 能力

Widget 类型声明 `topbar`、`leftbar`、`leftbarRail`、`rightbar`、`drawer` 能力：

| 类型 | Topbar | Leftbar | Rail | Rightbar | Drawer |
| --- | :---: | :---: | :---: | :---: | :---: |
| Brand / Menu / Search / Actions / Visitor | ✓ | ✓ | ✓ |  | ✓ |
| Spacer | ✓ |  |  |  |  |
| TOC | ✓ | ✓ | ✓ | ✓ | ✓ |
| Tree / Tagtree |  | ✓ | ✓ | ✓ | ✓ |
| Recent / Related / GitHub / Author |  | ✓ |  | ✓ | ✓ |
| Timeline / Markdown |  | ✓ |  | ✓ | ✓ |

未声明能力的自定义 Widget 默认只支持 Leftbar、Rightbar 和 Drawer。实例不能用内联 `presentations` 扩大类型能力，也不存在万能 Topbar Popover 回退。

不支持的位置产生 `unsupported_widget_presentation` warning，包含 Widget、layout、目标 Region、Profile 和支持列表。实例会被跳过；跳过后 Region 为空则不输出 DOM。仅有此类 warning 时 Doctor 的 `ok` 仍为 `true`。

## Leftbar 内部分区与 Rail

Leftbar 不公开第二套槽位配置。Catalog 自动把 Brand/Search 放入固定顶部，其他 Widget 按原数组顺序进入中间独立滚动区；单一语义 Footer 的第一行放 Actions，第二行放 Visitor 与折叠按钮。主体顶部不渐隐，底部使用透明渐隐，64px 留白只属于主体 Widget Stack。系统控制栏始终存在，Visitor 未配置时只显示右侧折叠按钮；Leftbar 不存在时不生成控制栏。

桌面 Leftbar 支持 `expanded` 与 `collapsed`。折叠态只显示支持 `leftbarRail` 的 Widget；Timeline、Markdown 等 Panel-only Widget 隐藏到重新展开。

状态保存在版本化键 `stellar:v2:leftbar-state`，并由 `<head>` 中的首屏脚本在布局计算前恢复。旧 Sidebar 状态键不迁移。Rail 使用实际 64px 宽度；Visitor 只显示头像，折叠/展开按钮位于其下方，临时 Drawer 中恢复头像和昵称。

在 `≤768px` 时 Leftbar 攟为 Drawer，不保留永久 Rail。

## Rightbar 与 Drawer

Rightbar 在 `>1180px` 是 Shell 约束的固定高度 Sticky 面板，内部独立滚动；桌面 Viewport 透明，背景、边框与模糊由内部 Widget 自己消费 Appearance Token，TOC 不再创建第二层 Sticky。`769–1180px` 时 Rightbar 先转为带完整 Appearance 表面的 Drawer、Leftbar 自动转为 Rail；`≤768px` 时两个侧栏都进入互斥 Drawer。

Wiki 默认使用 `topbar: [spacer, menu, actions]` 与 `leftbar: [wiki_home, search, brand, tree]`。Wiki Home 和已配置的 Search 组成项目工具栏，Brand 继续读取 Wiki Collection Identity，不会自动搬到 Topbar；只要最终 Wiki Leftbar 非空，Footer 至少包含一个 Visitor。

Drawer 复用原 Region 节点并遵守 ARIA、焦点转移、Escape、焦点恢复、`inert` 与 reduced-motion 契约。

## 与其它维度正交

- `appearance.preset: card | glass | minimal | flat` 只决定视觉 Token。
- Blueprint 只做一次性文件生成，不参与运行时继承。

首页固定使用标准文章 Feed；切换 Appearance 或 Blueprint 不会改变 Region DOM。

## 迁移

预发布旧名不保留运行时别名：

| 旧字段/能力 | 新字段/能力 |
| --- | --- |
| `layout.regions` 下的旧键 `sidebar` | `leftbar` |
| `layout.regions` 下的旧键 `context` | `rightbar` |
| Profile/Collection/Page 的 `regions.sidebar` | `regions.leftbar` |
| Profile/Collection/Page 的 `regions.context` | `regions.rightbar` |
| `sidebarRail` | `leftbarRail` |
| `appearance.backgrounds` 下的旧键 `sidebar` | `leftbar` |
| v1 `sidebar.left.widgets` | `regions.leftbar.widgets` |
| v1 `sidebar.right.widgets` | `regions.rightbar.widgets` |
| `sidebar.left.brand` | 业务数据放入 `site.brand`，Region 放置 `brand` |
| `sidebar.left.search/menu/wiki_home` | 在目标 Region 的 `widgets` 中放置系统 Widget |
| 旧 Sidebar 的独立 `surface` | `appearance.preset` |

Doctor 会直接拒绝旧字段并给出精确迁移目标。

实现入口：`scripts/lib/regions.js`、`scripts/lib/widget-registry.js`、`scripts/lib/doctor.js`、`layout/_partial/regions/widgets.ejs`、`source/js/main.js`。
