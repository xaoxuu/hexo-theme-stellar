---
title: 左栏 UI 风格（glass / card）检查清单
date: 2026-08-12
---

# 检查清单 / 验证记录

## 验证

- [x] `npm run lint` 通过
- [x] `npm test` 通过（9/9）
- [x] 在主工程执行 `npm run g` 全量构建通过
- [ ] 页面类型覆盖：首页 / 文章页 / Wiki 页（`npm run s` 预览待用户验收）
- [x] `python3 docs/knowledge/tools/verify.py` 知识库硬事实核查通过
- [ ] 浏览器兼容性检查（浅色 / 深色模式、桌面 / 移动端，随预览验收）

## 文档同步

- [x] `docs/knowledge/` 对应领域已更新（sidebar-system.md、layout-overview.md、知识库全量.md）
- [x] `docs/knowledge/VERIFICATION.md` 已登记偏差修正（本次无偏差，无需登记）
- [x] 主仓库 `source/wiki/stellar/sidebar.md` 已同步
