---
title: banner hover 动画对齐封面 + 渐变模糊层黑色蒙版检查清单
date: 2026-08-16
---

# 检查清单 / 验证记录

## 验证

- [x] 主工程 `npm run g` 全量构建通过（含 `hexo clean && hexo generate && gulp minify`）
- [x] `python3 docs/knowledge/tools/verify.py` 知识库硬事实核查通过（行号/版本异常 0；未解析文件与配置键为既有噪音，仅报告不阻断）
- [x] 编译产物抽查：`main.css` 含 `.banner-mask` / `.cover:after` / `.pin-slide:not(.no-cover)::after` / `.tag-plugin.banner:hover img.bg` 规则；文章页 HTML 含 `banner-mask top/bottom`
- [ ] 页面类型覆盖（人工 `npm run s` 预览）：首页 poster 卡片（top/bottom position）、置顶轮播、文章页 banner、含 `{% banner %}` 标签页面
- [ ] hover 行为（人工预览）：`img.bg` 缩放 1.05（1.5s 缓动）、亮度 75% / 饱和度 120%（0.2s 过渡）
- [ ] 蒙版行为（人工预览）：文字边缘不透明度约 0.5、垂直中线为 0；文章页 banner 蒙版与模糊层同步淡入

## 文档同步

- [x] `docs/knowledge/03-内容系统/post-lists-cards.md` 已更新
- [x] `docs/knowledge/05-前端交互/client-side-overview.md` 已更新
- [x] `docs/knowledge/04-标签插件/link-grid-banner-tags.md` 已补充 banner hover 说明
- [x] `docs/knowledge/知识库全量.md` 对应段落已同步
- [x] `docs/knowledge/VERIFICATION.md` 已登记
- [x] 主仓库 `source/wiki/stellar/advanced-settings.md` 已同步
