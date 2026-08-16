---
title: 文字自适应颜色通用能力检查清单
date: 2026-08-16
---

# 检查清单 / 验证记录

## 验证

- [x] `npm run lint` 通过（`source/js/color.js`、`source/js/plugins/adaptive-text.js`、`test/color.test.js`）
- [x] `npm test` 通过（新增 `test/color.test.js`：parse / luminance / isDark / lighten / darken / adaptiveTextColor）
- [x] 主工程 `npm run g` 全量构建通过（涉及 `scripts/tags/lib/banner.js`）
- [x] 页面类型覆盖：列表页 photo 封面 / 专栏 latest card / 文章页 banner / `{% banner %}` 标签
- [x] `python3 docs/knowledge/tools/verify.py` 知识库硬事实核查通过
- [ ] 浏览器兼容性检查（亮/暗背景图、CORS 失败回退、显式颜色覆盖）

## 文档同步

- [x] `docs/knowledge/` 对应领域已更新（post-lists-cards、content-overview、link-grid-banner-tags、client-side-overview、configuration）
- [x] `docs/knowledge/VERIFICATION.md` 已登记
- [x] `docs/knowledge/知识库全量.md` 已同步
- [x] 主仓库 `docs/specs/adaptive-text-color/` 方案与 `source/wiki/stellar/` 文档
