---
title: 修复 Safari 下 page 页顶部横幅 hover 方角检查清单（修订二：层叠上下文 + 强制合成）
date: 2026-08-16
---

# 检查清单 / 验证记录

## 验证

- [x] 主工程 `npm run g` 全量构建通过（含 `hexo clean && hexo generate && gulp minify`）
- [x] 编译产物抽查：`main.css` 中 `.article.banner` 含 `isolation:isolate`、`transform:translateZ(0)` 与 `clip-path:inset(0 round 24px)`；移动端媒体查询含 `clip-path:none`
- [x] 无头浏览器（Chrome 151）：`.article.banner` computed `isolation:isolate`、`transform:matrix(1,0,0,1,0,0)`（非 none）、`clip-path:inset(0px round 24px)`；`.bg+.content:before/:after` `clip-path` 为 `inset(0px round 24px)`；hover 后模糊层 opacity 0→1、rect 无位移；角部像素（距角 2px）hover 前后均为页面背景色、圆角内为横幅内容色；390px 移动端 `clip-path:none`（isolation/transform 保留无副作用）；container 页 3 个 `{% banner %}` 示例 `clip-path:none` 不受影响
- [x] `python3 docs/knowledge/tools/verify.py` 知识库硬事实核查通过（0 行号异常、0 版本不一致）
- [ ] 人工 Safari 26.5 预览（关键）：先 `npm run s` 确认本地最新构建，再在友链/about 等 page 页顶部横幅 hover（含动画结束后持续 hover）四角无方角；`{% banner %}`、文章列表 cover、置顶轮播、首页观感不变

## 文档同步

- [x] `docs/knowledge/03-内容系统/content-overview.md` 横幅说明已更新
- [x] `docs/knowledge/VERIFICATION.md` 登记行已更新
