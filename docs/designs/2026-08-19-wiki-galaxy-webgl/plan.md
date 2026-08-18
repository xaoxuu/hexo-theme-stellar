---
title: Wiki Galaxy WebGL 背景执行计划
date: 2026-08-19
---

# 执行计划

1. 新增原生 WebGL Galaxy 插件，移植 React Bits 着色器并实现尺寸、交互和渲染生命周期。
2. 将 Wiki Hero 的 2D 星点初始化替换为按需加载逻辑，完善 Canvas 样式与静态降级。
3. 同步第三方许可、主题知识库、核查记录和主站 Wiki 文档。
4. 执行主题检查、主工程全量构建和浏览器验收，记录结果。

## 风险与回退

- WebGL 不可用或着色器编译失败时保留 CSS 纯黑底色，只跳过动态层。
- `prefers-reduced-motion: reduce` 下不加载插件，继续使用静态背景。
- 插件只由 Galaxy Canvas 触发，不增加其它页面的脚本请求。
