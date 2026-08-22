---
title: Brand、导航与页头
domain: 布局系统
tags:
  - Brand
  - 导航
  - 菜单栏
---

# Brand、导航与页头

> [!IMPORTANT]
> v2 已将站点品牌、集合 Identity 与内容 Banner 分离；公开字段以[内容配置 Schema v2](../03-内容系统/content-schema-v2.md)为准。

<details>
<summary>相关源码文件</summary>

- [layout/_partial/sidebar/brand.ejs](../../../layout/_partial/sidebar/brand.ejs)
- [scripts/helpers/brand.js](../../../scripts/helpers/brand.js)
- [scripts/lib/brand.js](../../../scripts/lib/brand.js)
- [layout/_partial/sidebar/menu.ejs](../../../layout/_partial/sidebar/menu.ejs)
- [source/css/_components/sidebar/brand.styl](../../../source/css/_components/sidebar/brand.styl)
- [layout/layout.ejs](../../../layout/layout.ejs)

</details>

## Brand 配置

站点默认 Brand 位于 `site.brand`，省略的 `image.src/name/tagline` 分别从 Hexo `avatar/title/subtitle` 派生：

```yaml
site:
  brand:
    image:
      variant: avatar
      url: /about/
      background: 'var(--block)'
    url: /
```

页面或集合暂时仍在 `sidebar.left.brand` 中覆盖，并在 ViewModel 边界收敛到同一输出结构。Brand 根字段逐项合并，但覆盖层中的 `image` 是不可拆分的原子对象。

| 字段 | 语义 |
| --- | --- |
| `image.src` | 图片资源 |
| `image.variant` | `avatar`、`icon` 或 `plain` |
| `image.url` | 点击图片后的链接 |
| `image.background` | 显式图片背景，省略时透明 |
| `name` | 品牌名称，可使用受信任的内联 HTML |
| `tagline` | 辅助文案；使用 `|` 可配置 hover 替换文案 |
| `url` | 点击名称后的链接 |

`name` 与 `image.src` 不解析 Markdown 链接。完整 `[文本](链接)` 会在构建期报错，链接必须写入对应的 `url`。

## 图片样式

外层 `.brand-image` 统一负责 48×48 尺寸、链接和背景；内部 `<img>` 只负责图片填充。

| variant | 几何与填充 | 背景 |
| --- | --- | --- |
| `avatar` | 正圆裁剪，`object-fit: cover` | 默认透明，可显式配置；支持头像旋转背景 |
| `icon` | `$border-card-s` 圆角矩形，`object-fit: contain` | 默认透明，可显式配置 |
| `plain` | 不裁剪、不设圆角，`object-fit: contain` | 永远透明，配置背景会构建失败 |

头像动画只在 `avatar` 分支输出 `.brand-image-bg`，不会影响图标或透明原图。

## 解析顺序

Brand resolver 的优先级为：

1. 页面 `sidebar.left.brand`
2. 集合 `sidebar.left.brand`
3. Wiki / Notebook 自动 Brand
4. 全局 `site.brand`

Wiki 与 Notebook 的自动 Brand 使用集合 `identity.icon`、`name`、`tagline` 和首页 URL；缺少 `identity.icon` 时只回退 `theme.default.project`。身份图片不会从 `card.cover`、Hero 背景或 Banner 等其它角色获取。

Topic 默认完整继承站点 Brand，不使用 Topic 的 `identity`、文案或路由自动生成品牌；只有显式的 `sidebar.left.brand` 才会覆盖站点 Brand。Wiki URL 取生成后的 `homepage.path`，Notebook URL 取 `routing.base_dir`。

## 手机端 Brand 栏

桌面左栏始终按当前页面解析 Brand。移动端内容区只在下列索引或列表页输出 `.brand-header.mobile-only`：

- 主页、分类页、标签页；
- 分类索引、标签索引；
- 专栏索引、Wiki 索引、笔记本索引；
- 笔记列表。

文章、普通页面、Wiki/Topic/Notebook 内容页、归档、作者页和 404 不输出手机端 Brand。显示规则集中在 `scripts/lib/brand.js`，不读取页面或集合开关。

## 导航菜单

Brand 与菜单是两个独立组件。`navigation.menu` 选择 `site.menu.items` 中的激活 `id`，`navigation.breadcrumb` 控制正文面包屑；菜单项使用 `accent` 声明强调色，图标仍使用通用 `icon()` helper，与 `brand.image` 无关。

左栏渲染顺序为 Brand、搜索、导航/组件滚动区和页脚社交入口。Wiki 内容页可通过 `sidebar.left.wiki_home` 控制 Brand 上方的“所有项目”返回入口，这个开关不影响 Brand 本身。

## DOM 与样式契约

```html
<header class="brand-header">
  <div class="brand-wrap">
    <a class="brand-image brand-image--avatar">…</a>
    <a class="brand-title">
      <div class="brand-name">…</div>
      <div class="brand-tagline">…</div>
    </a>
  </div>
</header>
```

DOM、partial、helper 和 Stylus 文件统一使用 `brand` 命名。`.icon` 只保留给通用 SVG 图标系统，避免图片 wrapper 与 `<img>` 重复套用相同视觉样式。
