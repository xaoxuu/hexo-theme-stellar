---
title: Footer Social 图片图标尺寸修复
date: 2026-08-20
status: 已实施
---

# Footer Social 图片图标尺寸修复方案

## 1. 问题与目标

Footer Social 的内联 SVG 固定为 24×24px，图片图标却使用自动宽高。URL 图标经 `icon()` 输出为 `<img>` 后会按固有尺寸撑宽按钮或被裁切。

成功标准：普通 Social 与 dropdown trigger 中的图片图标和 SVG 使用相同的 24×24px 图标盒；非方形图片等比容纳；按钮和交互行为保持不变。

## 2. 技术方案

- 在 `source/css/_components/sidebar/footer.styl` 中将 `.social img` 的宽高固定为 24px，并增加 `object-fit: contain`。
- 复用现有 SVG 尺寸，不新增配置、设计令牌、mixin、模板或客户端逻辑。
- 保留 `flex: initial`，继续覆盖通用 dropdown trigger 的 20px 图标规则。

## 3. 影响范围

- 仅影响左栏 Footer Social 普通链接和 dropdown 主按钮中的直接图片图标。
- 图片圆角、灰阶、透明度、渐变、surface 背景与阴影、菜单条目均不变。
- 同步 Sidebar 知识库、核查记录与主工程 Stellar Wiki。

## 4. 验证方式

- 运行定向尺寸断言，确认图片与 SVG 均为 24×24px。
- 执行主题 `npm run check` 与主工程 `npm run g`。
- 检查普通按钮和 dropdown trigger 的默认、hover、open 状态未发生非预期变化。
