---
title: 按需打包优化检查清单
date: 2026-08-15
---

# 检查清单 / 验证记录

## 验证

- [x] `npm run lint` 通过（新增 services.js 全局声明与 utils.js hasOwnProperty 修正）
- [x] `npm test` 通过（73 项）
- [x] 主工程 `npm run g` 全量构建通过（229 个文件，含 13 个新资源）
- [x] 页面类型覆盖：首页 / 文章页（artalk 评论）/ Wiki 页（mermaid）/ 友链页（swiper）/ 笔记页（生成 HTML 检查通过）
- [x] `python3 docs/knowledge/tools/verify.py` 知识库硬事实核查通过（exit 0，仅遗留既有 glob 占位报告）
- [ ] 交互回归（浏览器）：swiper / fancybox / mermaid / scrollreveal / 搜索 / 主题切换 / 图片懒加载（结构已核对，交互待用户 `npm run s` 验收）

## 体积对比（实施后填写）

- 首页：HTML inline `33.8KB → 13.3KB`（raw 107.6KB → 87.3KB，gzip 25.4KB → 18.6KB）
- 文章页：HTML inline `32.5KB → 12.1KB`（raw 83.8KB → 63.5KB）
- Wiki 页：HTML inline `30.8KB → 10.3KB`（raw 90.8KB → 70.5KB）
- main.css：`258KB → 244KB` raw（gzip 35.2KB → 32.6KB）；swiper/fancybox/评论样式移出，未启用评论样式（约 6.2KB）不再编译
- 按需文件：swiper.css 2.0KB / mermaid.css 4.8KB / fancybox.css 0.1KB / artalk.css 6.7KB；外置 JS：utils.js 11.4KB / stellar-icons.js 6.0KB / services.js 3.0KB / theme.js 1.1KB（均带 `?v=` 版本参数）
- 无插件/评论页面不再加载对应 CSS；tagtree.js 仅在有 tagtree 小部件的页面输出

## 文档同步

- [x] `docs/knowledge/05-前端交互/client-side-overview.md` 已更新
- [x] `docs/knowledge/09-高级主题/performance.md` 已更新
- [x] `docs/knowledge/07-外部集成/plugin-system.md` 已更新
- [x] 引用路径修正：code-highlighting / note-container-tags / timeline-media-tags / tabs-utils
- [x] `docs/knowledge/VERIFICATION.md` 已登记
- [x] `source/wiki/stellar/advanced-settings.md` 已同步（含 `updated` 刷新）
