---
title: 修复 banner 内导航激活项玻璃模糊检查清单
date: 2026-08-16
---

# 检查清单 / 验证记录

## 验证

- [x] 主工程 `npm run g` 全量构建通过（含 `hexo clean && hexo generate && gulp minify`）
- [x] 编译产物抽查：`main.css` 不再含 `.tag-plugin.banner .navbar a.active` 的 backdrop-filter 规则，含 `rgba(255,255,255,.25)` 背景
- [x] 无头浏览器：激活链接 computed `backdrop-filter` 为 `none`、背景半透明白；强制 `scale(1.05)` 后图片绘制不侵入圆角裁剪区（像素差分）
- [x] `python3 docs/knowledge/tools/verify.py` 知识库硬事实核查通过
- [ ] 人工 `npm run s` 预览：container.md 三个例子（激活项可辨、hover 变卡片色）、含 `{% navbar %}` 的 banner 页面、移动端宽度

## 文档同步

- [x] `docs/knowledge/04-标签插件/link-grid-banner-tags.md` 已补充说明
- [x] `docs/knowledge/VERIFICATION.md` 已登记
- [x] 主站 `source/wiki/stellar/tag-plugins/container.md` 示例写法不变，无需改动
