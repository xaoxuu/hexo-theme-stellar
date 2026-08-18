---
title: Wiki Galaxy WebGL 背景方案
date: 2026-08-19
status: 已实施
---

# Wiki Galaxy WebGL 背景方案

## 1. 问题与目标

- 现有 `background: galaxy` 使用 2D Canvas 绘制固定数量的随机星点，缺少星场纵深、辉光、闪烁和连续旋转。
- 将 React Bits Galaxy 的着色器效果移植到 Stellar 原生浏览器环境，同时保持现有 Wiki 配置接口不变。
- 透明 WebGL Canvas 使用纯黑 `#000000` 作为底色；WebGL、脚本或动画偏好不满足条件时保留该静态底色，不能影响 Hero 内容和交互。

## 2. 技术方案

- 新增按需加载的 `source/js/plugins/galaxy.js`，使用原生 WebGL 全屏三角形运行 React Bits Galaxy 片元着色器，不引入 React、OGL 或新构建依赖。
- 固定使用 `density: 2`、`glowIntensity: 0.5`、`saturation: 0.1`、`hueShift: 140`、`twinkleIntensity: 0.1`、`rotationSpeed: 0.1`、`starSpeed: 2`、`speed: 0.5`；开启鼠标视差，关闭鼠标排斥与中心排斥。
- `main.js` 仅在页面存在 `.wiki-cover-background.galaxy canvas` 且用户未启用减少动态效果时加载插件。
- 插件响应容器尺寸、页面可见性和视口可见性；离开页面时释放事件、观察器和 WebGL 上下文。
- Canvas 不接收指针事件；鼠标位置从整个 Wiki Hero 采集，保证内容层上方仍能产生视差且不阻断按钮点击。

## 3. 影响范围

- 客户端：Galaxy 按需加载、WebGL 渲染与生命周期管理。
- 样式：Canvas 铺满 Hero、底色与自适应文字取色基准统一为 `#000000`，并禁止截获交互。
- 文档：同步 Wiki 配置说明、主题知识库和核查记录；增加 React Bits MIT 第三方许可声明。
- 对外接口不变，静态图片背景、无背景 Hero 和自适应文字取色不变。

## 4. 验证方式

- 主题仓库执行 `npm run check`。
- 主工程执行 `npm run g`，并以 `npm run s` 检查桌面端、移动端、鼠标视差、尺寸变化、可见性暂停和静态回退。
