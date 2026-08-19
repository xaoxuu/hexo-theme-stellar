---
title: Collection Density 简化检查清单
date: 2026-08-20
---

# 检查清单 / 验证记录

## 验证

- [x] 源码与构建产物不存在 `data-density="regular"`、regular density 样式或 8px collection gap。
- [x] 系统次要列表为 compact，menubar/linklist/普通集合为 auto；menubar 专属 gap 保持 2px。
- [x] 主工程 `npm run g` 全量构建通过（生成 252 个文件，HTML/CSS/JS minify 完成）。
- [x] `python3 docs/knowledge/tools/verify.py` 知识库硬事实核查通过（行号异常 0、版本不一致 0；既有未解析文件与配置键仅报告、不阻断）。
- [x] 浏览器检查：首页 menubar auto/recent compact，About linklist auto，Wiki tree/related compact，开发预览 auto/compact 对照正确且 regular 为 0。
- [x] Notebook tagtree 源码固定输出 compact；主工程当前无 notebook 数据，未生成可供浏览器检查的 tagtree DOM。

## 文档同步

- [x] `docs/knowledge/06-数据服务与组件/widget-architecture.md` 已更新。
- [x] `docs/knowledge/VERIFICATION.md` 已登记。
- [x] 主工程 Stellar Wiki 已同步并刷新 `updated`。
