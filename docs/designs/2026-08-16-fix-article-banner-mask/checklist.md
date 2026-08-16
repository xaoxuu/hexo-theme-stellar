---
title: 修复页面顶部横幅黑色蒙版检查清单
date: 2026-08-16
---

# 检查清单 / 验证记录

## 验证

- [x] 主工程 `npm run g` 全量构建通过（含 `hexo clean && hexo generate && gulp minify`）
- [x] 编译产物抽查：`main.css` 含 `.banner-mask-top` / `.banner-mask-bottom` 规则，不再含 `.banner-mask.top` / `.banner-mask.bottom`；友链页 HTML 含 `banner-mask banner-mask-top/bottom`
- [x] 无头浏览器几何断言：`banner-mask-top` / `banner-mask-bottom` 盒与 `.article.banner` 完全重合，未 hover 时 `opacity: 1`，hover 时蒙版不位移、模糊层淡入
- [x] `python3 docs/knowledge/tools/verify.py` 知识库硬事实核查通过
- [ ] 人工 `npm run s` 预览：友链页、文章页有图 banner、无 banner 页面、`{% banner %}` 标签页面、移动端宽度

## 文档同步

- [x] `docs/knowledge/03-内容系统/content-overview.md` 已补充页面横幅黑色蒙版说明
- [x] `docs/knowledge/VERIFICATION.md` 已登记
- [x] 主仓库 `source/wiki/stellar/advanced-settings.md` 措辞仍准确，无需改动
