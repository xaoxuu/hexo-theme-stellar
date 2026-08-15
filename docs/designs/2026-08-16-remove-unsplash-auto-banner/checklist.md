---
title: 移除 auto_banner 检查清单
date: 2026-08-16
---

# 检查清单 / 验证记录

## 验证

- [x] `npm run check` 通过（lint + 单测 91/91 + 依赖声明 + 知识库硬事实核查 0 异常）
- [x] 主工程 `npm run g` 全量构建通过（247 文件，minify 通过）
- [x] 页面类型覆盖：首页 / 文章页 / 列表页
- [x] 有 `banner:` URL 的文章页横幅正常显示
- [x] 无 banner 的文章页显示纯文字横幅
- [x] 列表卡片：无 `cover` 不渲染封面；有 URL `cover` 正常渲染

## 文档同步

- [x] `docs/knowledge/00-总览与安装配置/configuration.md` 已更新
- [x] `docs/knowledge/03-内容系统/content-overview.md` 已更新
- [x] `docs/knowledge/03-内容系统/post-lists-cards.md` 已更新
- [x] `docs/knowledge/知识库全量.md` 已同步
- [x] `docs/knowledge/VERIFICATION.md` 已登记
