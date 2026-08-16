---
title: 修复 Safari 下文章列表封面底部方角检查清单
date: 2026-08-16
---

# 检查清单 / 验证记录

## 验证

- [x] 主工程 `npm run g` 全量构建通过（含 `hexo clean && hexo generate && gulp minify`）
- [x] 编译产物抽查：`main.css` 中 `.post-card` 含 `clip-path:inset(0 round 24px)`；`.cover:before` 含 `transform:translateZ(0)`；hover 覆盖规则 `.post-card.post.photo:hover .cover:before{transform:translateZ(0) scale(1.05)}`
- [x] 无头浏览器（Chrome 151）：`.post-card` computed `clip-path:inset(0px round 24px)`；`.cover:before` 静止时 `transform` 为恒等矩阵、hover 后为 `matrix(1.05,...)` 且 hoverState=true、卡片 rect 无位移；filter blur/mask 不变；17 张卡片均应用 clip-path；A/B 中和（注入 `clip-path:none` + `transform:none`）后同像素无变化，确认无 Chrome 回归
- [x] `python3 docs/knowledge/tools/verify.py` 知识库硬事实核查通过（0 行号异常、0 版本不一致）
- [ ] 人工 Safari 26.5 预览（关键）：强制刷新后 photo 封面静止与 hover 底部两角均圆角、无方角，顶部不变；置顶轮播、`{% banner %}`、文章页横幅无回归

## 文档同步

- [x] `docs/knowledge/03-内容系统/post-lists-cards.md` 渐变模糊层小节已更新
- [x] `docs/knowledge/VERIFICATION.md` 已登记
