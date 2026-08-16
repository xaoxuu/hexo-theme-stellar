---
title: utils.js 延迟加载加固 检查清单
date: 2026-08-16
---

# 检查清单 / 验证记录

## 验证

- [x] 主题 `npm run check`（lint + 单测 + 依赖声明 + 知识库硬事实核查）通过
- [x] 主工程 `npm run g` 全量构建通过
- [x] 无头 Chrome：正常首页/文章页无新增控制台错误、卡片可见
- [x] 无头 Chrome：utils.js 占位改写场景（复刻真实占位改写）无 `utils is not defined`、卡片可见
- [x] 无头 Chrome：utils.js 加 defer 场景无重复声明错误
- [x] 无头 Chrome：删除 utils.js 标签场景自动补载、卡片可见
- [x] 兜底：拦截 utils.js / scrollreveal 时 3 秒后 `sr-fallback` 生效

## 文档同步

- [x] `docs/knowledge/05-前端交互/client-side-overview.md` 补充说明
- [x] `docs/knowledge/07-外部集成/plugin-system.md` 补充说明
- [x] `docs/knowledge/VERIFICATION.md` 登记
