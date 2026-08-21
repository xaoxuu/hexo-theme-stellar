---
title: Wiki Hero 动画独立配置检查清单
date: 2026-08-21
---

# 检查清单 / 验证记录

## 验证

- [x] 主题 lint、172 项测试与知识库硬事实核查通过
- [x] 主题 `npm run check` 完整通过
- [x] 主工程 `npm run g` 通过
- [x] 默认参数、部分覆盖、非法值回退和多 Canvas 独立配置测试通过
- [x] 无背景无动画、仅图片、仅 Galaxy、图片与 Galaxy 叠加、未知类型均符合配置契约
- [x] 减少动态效果、WebGL 初始化失败和离开视口时正确降级或暂停
- [x] Wiki Hero 按钮、终端和正文滚动不受 Canvas 影响
- [x] 桌面端 1280×720 与移动端 390×844 预览正常，Canvas 尺寸自适应且无横向溢出

## 文档同步

- [x] `docs/knowledge/03-内容系统/wiki-docs.md` 已更新
- [x] `docs/knowledge/VERIFICATION.md` 已登记
- [x] 主站 Wiki 配置与使用文档已迁移，正文 `updated` 已刷新
