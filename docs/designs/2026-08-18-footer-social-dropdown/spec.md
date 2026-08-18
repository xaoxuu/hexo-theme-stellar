---
title: 通用 Dropdown 组件与 Footer Social 入口
date: 2026-08-18
status: 已实施
---

# 通用 Dropdown 组件与 Footer Social 入口方案

## 1. 问题与目标

当前下拉菜单样式耦合在 Footer Social 中，除 footer 外无法复用。需要将下拉菜单的结构样式抽象为通用组件，并提供 `{% dropdown %}` 标签；同时保留 `footer.social` 作为一个配置驱动的使用入口。

目标：

- 保持现有普通 social 配置完全兼容。
- 新增与现有 `.social` 按钮一致的圆形下拉触发按钮。
- `{% dropdown %}` 触发器固定使用圆角端点绘制的箭头，展开时旋转 180°。
- 下拉子项使用统一的图标、标题、链接结构。
- 组件不包含任何语言或其它业务语义。
- 下拉菜单样式不依赖 footer 或 tag plugin 的业务结构。
- 使用一个挂载在 `body` 下的全局 dropdown 浮层，避免菜单被任意祖先容器裁剪。
- 使用原生 `<details>/<summary>` 保留展开语义，并由通用脚本处理浮层定位、关闭和键盘操作。

## 2. 技术方案

普通条目保持原有结构：

```yaml
footer:
  social:
    github:
      icon: '<img src="..."/>'
      title: GitHub
      url: https://github.com/
```

下拉条目使用：

```yaml
footer:
  social:
    links:
      type: dropdown
      icon: default:global
      title: 更多链接
      items:
        - icon: default:home
          title: 首页
          url: /
        - icon: default:github
          title: GitHub
          url: https://github.com/
```

`type` 未设置时按普通链接渲染；`type: dropdown` 时由 dropdown partial 渲染。主按钮的 `title` 用于提示和无障碍标识，子项 `title` 作为可见文本。链接沿用现有内部/外部 URL 处理规则。

文章内容可以使用通用标签：

````md
{% dropdown direction:down 更多链接 %}
- icon:default:documents [文档](/wiki/)
- icon:default:github [GitHub](https://github.com/)
{% enddropdown %}
````

标签的子项使用 Markdown 链接表示标题和 URL，使用 `icon:key` 指定图标；`direction` 支持 `up` / `down`，`align` 支持 `left` / `right`，未指定时自动贴合触发元素更靠近视口的一侧。

实现分层：

- `layout/_partial/sidebar/index_leftbar.ejs`：遍历并分派普通 social 与 dropdown 条目，保留 YAML 顺序。
- `layout/_partial/dropdown.ejs`：渲染 Footer 使用的通用 `<details>` 结构。
- `scripts/tags/lib/dropdown.js`：注册 `{% dropdown %}` 块标签，并以内联 SVG 绘制固定箭头。
- `source/css/_common/dropdown.styl`：提供 `.dropdown`、`.dropdown-trigger`、`.dropdown-menu` 和 `.dropdown-item` 通用样式；菜单背景复用 `bar-glass($border-card)` 玻璃效果。
- `source/css/_components/sidebar/footer.styl`：只保留 Footer Social 的按钮视觉和原生渲染兜底定位。
- `source/js/plugins/dropdown.js`：创建全局浮层，根据触发按钮周围的可用空间自动选择上下、左右位置，并用透明桥接区连接触发按钮与菜单。
- `_config.yml`：补充通用配置示例与字段说明。

不新增语言专用脚本或文案；通用交互统一由 `source/js/plugins/dropdown.js` 处理。不增加嵌套 dropdown，不识别 `code` 或语言业务字段。

## 3. 影响范围

- 对外新增 `footer.social.*.type`、`footer.social.*.items` 配置。
- 对外新增 `{% dropdown %}` 标签及其 Markdown 链接子项语法。
- 既有 `icon`、`title`、`url`、`onclick` 配置保持兼容。
- 未指定方向时，dropdown 根据视口中触发按钮的上下空间自动选择展开方向；`direction:up/down` 仍可作为显式偏好。
- 菜单通过 `position: fixed` 挂载到 `body` 下，不修改 sidebar 或其它祖先容器的 `overflow`。
- 鼠标移入触发按钮时自动展开；透明桥接区覆盖触发按钮与菜单之间的路径，离开触发按钮、菜单和桥接区后立即关闭，不使用延迟计时器。
- 菜单完成定位后使用淡入动画显示，并尊重 `prefers-reduced-motion`。
- 下拉菜单设置最大视口高度并允许垂直滚动，避免子项过多时超出屏幕。
- 需要同步主题知识库的侧栏/配置文档，以及主工程 Stellar Wiki 的 footer 使用说明。

## 4. 验证方式

- 首页、文章页、Wiki 页检查普通 social 与 dropdown 的渲染。
- 检查 dropdown 的展开、收起、键盘聚焦和子项跳转。
- 检查外链属性、HTML 属性转义和非法空配置不产生空按钮。
- 检查 dropdown 标签的主图标、子项图标和 Markdown 链接解析。
- 检查标签触发器箭头的圆角端点与展开旋转状态。
- 执行 `python3 docs/knowledge/tools/verify.py`。
- 在主工程执行 `npm run g` 全量构建。
