---
title: 胶囊形状元素取消连续曲率圆角 检查清单
date: 2026-08-12
---

# 检查清单 / 验证记录

## 验证

- [ ] 主工程 `npm run g` 全量构建通过（CSS 变更验证）
- [ ] `npm run s` 预览首页 / Wiki 页与移动端，navbar top 胶囊按钮与 float-panel 为两端正圆端帽
- [ ] 主题仓库 `npm run check`（lint + 单测 + 知识库硬事实核查）通过
- [ ] 浏览器兼容性：不支持 `corner-shape` 时回退为 `border-radius` 渲染

## 文档同步

- [x] `docs/knowledge/02-布局系统/logo-navigation-headers.md` 已更新
- [x] `docs/knowledge/01-样式系统/responsive-design.md` 已更新
- [x] `docs/knowledge/VERIFICATION.md` 已登记
