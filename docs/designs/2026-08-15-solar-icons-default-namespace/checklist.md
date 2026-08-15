---
title: default 命名空间图标统一替换为 Solar 检查清单
date: 2026-08-15
---

# 检查清单 / 验证记录

## 验证

- [x] `npm run lint` 通过
- [x] `npm test` 通过（73 项，icons.yml 键完整性单测覆盖新旧引用）
- [x] 在主工程执行 `npm run g` 全量构建通过（216 文件生成 + minify，`scripts/` 有改动必做）
- [x] 页面类型覆盖：首页文章卡片 / 分类页 / 笔记卡片 / 评论系统 loading / TOC / 侧边栏 / 复制与下载按钮 / weibo-timeline（生成产物抽查：calendar/folder/alt-arrow-left/refresh/chat-square/pen 路径均已渲染，旧图标路径已清除）
- [x] `python3 docs/knowledge/tools/verify.py` 知识库硬事实核查通过（未解析文件/配置键为既有报告项，不阻断）
- [x] `default:search`（三态着色 `p-id="1562"`）、`default:rss` 还原为原键原值后复查：`npm run check` 与主工程 `npm run g` 通过，生成产物含原 search/rss 图标路径
- [x] `default:search` 尝试 Solar line-duotone 后因线条过细还原为原图标：`npm run check` 与主工程 `npm run g` 通过，生成产物含原 `p-id="1562"` 搜索图标
- [x] `default:leftbar` / `default:rightbar`（`#sep` 动画）还原为原键原值后复查：`npm run check` 与主工程 `npm run g` 通过

## 文档同步

- [x] `docs/knowledge/04-标签插件/icon-tag.md` 已更新（特殊类表、白名单、内置图标键）
- [x] `docs/knowledge/03-内容系统/post-lists-cards.md` 已更新（日期/分类图标键）
- [x] `docs/knowledge/00-总览与安装配置/configuration.md` 已更新（image_onerror 键）
- [x] `docs/knowledge/知识库全量.md` 已同步
- [x] `docs/knowledge/VERIFICATION.md` 已登记
