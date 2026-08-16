---
title: 修复 Safari 下文章列表封面底部方角（模糊层常驻 transform + 卡片 clip-path）
date: 2026-08-16
status: 已实施
---

# 修复 Safari 下文章列表封面底部方角（模糊层常驻 transform + 卡片 clip-path）

## 1. 问题与目标

- Safari 26.5 下文章列表 photo 封面**静止时底部两角为方角，hover 后反而消失**；顶部无此问题。
- 根因（与文章页顶部横幅同一 WebKit 合成层 bug，312584/319993）：`.post-card.post.photo .cover:before` 是常显的 `filter: blur()` 合成层，`position=bottom` 时其渐变 mask 底部不透明、顶部透明——静止时该层无 transform，Safari 26.4/26.5 不执行父级 `.post-card` 的 `overflow:hidden + border-radius` 圆角裁剪，于是只有 mask 不透明的底部两角露出方角；hover 时该层被赋予 `transform: scale(1.05)`，Safari 反而正确应用父级裁剪（「hover 后消失」即此现象的直接证据）。
- 成功标准：photo 封面静止与 hover 时底部两角均圆角、无方角；顶部不变；hover 放大与模糊效果照常；正常浏览器视觉零变化。

## 2. 技术方案

- `source/css/_components/list.styl`：
  - `.post-card.post.photo .cover:before`（同图模糊层）基础规则新增 `transform: translateZ(0)`（恒等变换，复现 hover 时 Safari 正常裁剪的状态）；hover 的 `scale(1.05)` 照常替换（现有 `transform .5s` 过渡不变）。
  - `.post-list .post-card` 新增 `clip-path: 'inset(0 round %s)' % $border-card-l`（与 `border-radius` 同源 24px；卡片圆角在各宽度下均不变，无需移动端分支），保留 `overflow: hidden`。
  - `img`、`:after` 黑色蒙版、hover 动画、`.cover-info` 均不动。
- 不动 `{% banner %}`、文章页顶部横幅（已修）、置顶轮播（结构与 cover 相同，用户此前确认正常，本次不主动改动）。

## 3. 影响范围

- 对外行为：仅修复 Safari 下 photo 封面底部角部渲染；正常浏览器中 `translateZ(0)` 为恒等变换、`clip-path` 与圆角完全重合，视觉零变化。
- 无新增配置项、无 API 变化；`.post-card` 的 `clip-path` 使卡片成为固定后代的包含块，但卡片内无 fixed 元素，无影响。
- 需要同步的知识库页面：`docs/knowledge/03-内容系统/post-lists-cards.md`（渐变模糊层小节），并在 `docs/knowledge/VERIFICATION.md` 登记。

## 4. 验证方式

- 主工程 `npm run g` 全量构建通过。
- 无头浏览器（Chrome）：`.post-card` computed `clip-path: inset(0px round 24px)`；`.cover:before` 静止时 computed `transform` 非 none（恒等矩阵）、hover 后为 `scale(1.05)`；截图像素检查封面底角（距角 2px）静止与 hover 均为页面背景色、无方角；其他卡片类型不受影响。
- 人工 Safari 26.5 验收（关键）：强制刷新后查看 photo 封面——静止与 hover 底部两角均圆角；置顶轮播、`{% banner %}`、文章页横幅无回归。
- `python3 docs/knowledge/tools/verify.py` 知识库硬事实核查。
