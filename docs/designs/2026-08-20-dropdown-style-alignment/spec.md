---
title: Dropdown 与侧栏列表样式统一
date: 2026-08-20
status: 已实施
---

# Dropdown 与侧栏列表样式统一方案

## 1. 问题与目标

Footer Social 的 dropdown 触发器虽然带有 `.social` 类，但通用 dropdown 的图标尺寸与打开态仍会形成独立覆盖；菜单项也维护了一套与侧栏 collection 重复的列表样式。正文标签的箭头位于文字左侧，且两种 dropdown 入口都要求子项必须配置图标。菜单容器还为文字叠加了多重明暗阴影，视觉上容易形成文字自带背景色的错觉。

成功标准：Footer dropdown 主按钮与普通 social 按钮尺寸和高亮一致；Footer 与正文菜单项复用 glass surface 的 collection list；正文箭头位于文字右侧；子项图标可省略；通用菜单在桌面与移动端的最小宽度统一为 150px；菜单文字不再带有额外光晕。

## 2. 技术方案

- 复用现有 `.social` 按钮规则与同一交互状态声明，不新增尺寸或颜色令牌；打开态与普通按钮 hover 使用相同背景、灰度和 SVG 渐变。
- Footer 的 `img` / `svg` 显式使用初始 flex 行为，覆盖通用 dropdown 图标的 `flex: 0 0 1.25rem`；保持 SVG 24×24px、图片自动宽高和按钮内容自适应，不增加固定宽度。
- Footer dropdown 主图标未激活时使用 `opacity: .5`，hover 或菜单打开后恢复为 `1`；普通 social 与正文 dropdown 不改变。
- dropdown 菜单组合 `.ui-collection` 与 `data-ui-surface="glass"`，条目组合 `.ui-collection__item/content/title/leading`；dropdown 自身只负责容器玻璃效果、定位、滚动与动画。
- dropdown 菜单使用 collection 的 `compact` 密度，将纵向 padding 从 8px 缩至 4px；局部 `--ui-item-min-height` 继续按 `1.5rem` leading 加上下 padding 计算，桌面为 32px、移动端约 35px。无图标项不输出空 leading，但与带图标项保持等高，且不改变 collection 的全局默认值。
- dropdown 菜单使用固定 150px 最小宽度，不再随根字号在移动端放大；现有视口最大宽度、滚动和定位规则保持不变。
- 移除 dropdown 菜单在浅色、深色和跟随系统深色模式下的 `text-shadow`；保留菜单玻璃背景、边框、投影以及 collection 条目的 hover/active 背景反馈。
- Footer partial 与标签脚本只在存在 `icon` 时输出 leading；`title` 和 `url` 仍是有效子项的必要字段。
- 正文标签先输出标题、后输出箭头；方向、旋转、键盘和浮层交互不变。

复用入口：现有 collection surface 令牌、collection DOM 类、Footer `.social` 规则、dropdown partial 与全局浮层脚本。无需新增 mixin、配置项、前端服务或依赖。

## 3. 影响范围

- 模板与标签：Footer dropdown partial、`{% dropdown %}` 标签输出和对应单测。
- 样式：通用 dropdown 删除重复 item 规则，Footer Social 合并打开态与普通按钮状态。
- 对外接口：`footer.social.*.items[].icon` 和标签子项的 `icon:key` 改为可选；旧写法保持兼容。
- 同步标签插件、Sidebar、配置和 collection 知识库，以及主工程 Stellar Wiki。

## 4. 验证方式

- 单测覆盖箭头顺序、collection DOM、带/不带图标、无效行、转义及内外链属性。
- 主题仓库执行 `npm run check`；主工程执行 `npm run g`。
- 检查生成 HTML 中 Footer trigger、glass collection 菜单及正文标签结构。
- 在浏览器读取实际盒模型，确认普通 social 与 dropdown trigger 均为 32×32px、内部 SVG 均为 24×24px，且 computed flex 一致。
- 检查 Footer dropdown 主图标默认 opacity 为 `0.5`，hover/open 状态为 `1`。
- 对比 Footer 与正文混合图标菜单，确认所有条目在桌面均为 32px、移动端约 35px，且无图标项不存在 leading 占位。
- 确认 Footer 与正文 dropdown 在桌面和移动视口的 computed `min-width` 均为 150px，长内容仍可自然扩宽。
- 检查编译 CSS 与明暗主题，确认 dropdown 菜单不再声明文字阴影，玻璃背景及条目 hover/active 反馈保持正常。
