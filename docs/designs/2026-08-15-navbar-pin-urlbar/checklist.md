---
title: 修复移动端 URL 栏伸缩导致 navbar 玻璃效果丢失 检查清单
date: 2026-08-15
---

# 检查清单 / 验证记录

## 验证

- [x] 主题仓库 `npm run check` 通过（lint 0 错误 + 91 项单测通过 + 知识库硬事实核查无版本/行号异常，仅报告既有无阻断项）
- [x] 主工程 `npm run g` 全量构建通过（hexo generate 247 文件 + gulp minify / Babel 转译成功）
- [x] 页面类型覆盖：首页（含置顶轮播）/ 分类 / 标签 / 归档 / Wiki 首页均成功生成
- [ ] 真机移动端：URL 栏伸缩时吸顶玻璃保持、离开顶部退回卡片（待真机验收）
- [ ] 桌面回归：吸顶玻璃、页面流卡片样式、深浅色模式不变（待浏览器验收）

## 文档同步

- [x] `docs/knowledge/05-前端交互/client-side-overview.md` 已更新
- [x] `docs/knowledge/知识库全量.md` 已更新
- [x] `docs/knowledge/VERIFICATION.md` 已登记
