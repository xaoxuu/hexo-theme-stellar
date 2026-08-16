---
title: TOC 底部按钮图标内联修复 检查清单
date: 2026-08-16
---

# 检查清单 / 验证记录

## 验证

- [x] `npm run check`（lint + 单测 + 依赖声明 + 知识库硬事实核查）
- [x] 主工程 `npm run g` 全量构建通过（247 files，2026-08-16）
- [x] 构建产物断言：TOC footer 两个图标为完整内联 `<svg>`（无 `data-icon` 占位符）
- [x] 页面类型覆盖：首页 / 文章页 / Wiki 页 / 窄屏断点（构建产物抽查；窄屏规则不受影响，`a+a` 堆叠与 `background` 不变）
- [x] 无头 Chrome 布局对照：空占位符不再挤压文字（svg 固定 16px、文字单行）

## 文档同步

- [x] `docs/knowledge/09-高级主题/performance.md` 已更新
- [x] `docs/knowledge/04-标签插件/icon-tag.md` 已更新
- [x] `docs/knowledge/VERIFICATION.md` 已登记
- [x] 主仓库 `source/wiki/stellar/tag-plugins/express.md` 已同步（`updated` 已刷新）
