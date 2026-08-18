---
title: 统一清理字号兼容别名检查清单
date: 2026-08-18
---

# 检查清单 / 验证记录

## 验证

- [x] 主题知识库硬事实核查通过（行号/版本门禁通过；已有未解析项仍存在）
- [x] 主工程 `npm run g` 通过
- [x] `npm run lint` 通过
- [x] `npm test` 通过（135 项）
- [x] 首页 / 普通文章 / story / Wiki / 列表页面完成构建覆盖
- [x] 生成 CSS 已检查桌面 root、移动 root+2、story root+2 级联
- [x] 源码不再包含旧字号变量和 `style.font-size.body` 配置
- [x] 生成 CSS 不含带引号的 `calc()`

## 文档同步

- [x] `docs/knowledge/01-样式系统/` 已更新
- [x] `docs/knowledge/09-高级主题/custom-styling-overrides.md` 已更新
- [x] `docs/knowledge/VERIFICATION.md` 已登记

## 结果

- `npm run g`：通过。
- `npm run lint`：通过。
- `npm test`：通过（135 项）。
- `python3 docs/knowledge/tools/verify.py`：硬门禁通过；已有未解析项仍存在。
- `npm run check` 的发版登记门禁仍受仓库既有 4 个历史提交未登记影响，不与本次字号清理混合处理。
