---
title: 头像彩虹光环由图片改为 CSS 锥形渐变
date: 2026-08-12
status: 已通过
---

# 头像彩虹光环 CSS 渐变方案

## 1. 问题与目标

侧边栏头像 hover（或 `animate: always` 时）旋转的彩虹光环目前由 CDN 图片实现：`layout/_partial/sidebar/logo.ejs` 在 `div.bg` 上内联 `background-image:url(...)`，引用 `rainbow64@3x.webp`。图片方案存在加载延迟、额外网络请求、无法跟随主题配色的缺点。

目标：改为纯 CSS 实现，与搜索条底部渐变动画（`style.gradient.searchbar` + `search-glow`）保持一致的代码风格与观感。成功标准：

- 光环由 `conic-gradient` 生成，不依赖任何外部图片；
- 沿用现有 `@keyframes spin` 旋转 4s 机制与 `style.animated_avatar.animate`（auto/always）显示逻辑；
- 渐变可通过配置键 `style.gradient.avatar` 定制，默认使用搜索条同款彩虹色。

## 2. 技术方案

- `_config.yml`：删除 `style.animated_avatar.background`；在 `style.gradient:` 块新增 `avatar`（conic-gradient，首尾同色保证旋转无缝）。
- `source/css/_components/sidebar/logo.styl`：`div.bg` 的 `background-size: cover` 替换为 `background: convert(hexo-config('style.gradient.avatar'))`；`spin` 动画与 hover/always 透明度逻辑不变。
- `layout/_partial/sidebar/logo.ejs`：`div.bg` 移除内联样式，保留元素作为光环层（透明度由 CSS 控制）。
- 涉及文件：`_config.yml`、`source/css/_components/sidebar/logo.styl`、`layout/_partial/sidebar/logo.ejs`、`docs/knowledge/`。

## 3. 影响范围

- 对外行为：`style.animated_avatar.background` 配置键废弃移除；新增 `style.gradient.avatar`；头像光环视觉效果由图片彩虹变为同色系 CSS 锥形渐变，动画速度不变。
- 使用方站点：设置了 `animated_avatar.background` 的站点需改为 `style.gradient.avatar`（未设置者无影响，走主题默认值）。
- 需要同步的知识库页面：`docs/knowledge/02-布局系统/logo-navigation-headers.md`（§2.5 动态头像）、`docs/knowledge/02-布局系统/sidebar-system.md`、`docs/knowledge/知识库全量.md`、`docs/knowledge/VERIFICATION.md`。

## 4. 验证方式

- 主题仓库 `npm run check`（lint + 单测 + 知识库核查）通过。
- 主工程 `npm run g` 全量构建通过（涉及模板与配置改动必做）。
- `npm run s` 预览：左侧边栏头像 hover 光环旋转；`always` 持续旋转；关闭时无 `div.bg`；浅色/深色模式与移动端头部 logo 正常。
