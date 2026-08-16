---
title: 修复 Safari 下 page 页顶部横幅 hover 方角（圆角父层层叠上下文 + 强制合成）
date: 2026-08-16
status: 已实施
---

# 修复 Safari 下 page 页顶部横幅 hover 方角（圆角父层层叠上下文 + 强制合成）

## 1. 问题与目标

- Safari 26.5 访问 page 页（友链、about 等）时，顶部横幅（`.article.banner`）hover 状态四角持续漏出半透明方角；用户确认**不限于动画过程，动画结束后只要处于 hover 就有**。
- 前两轮修复均实测无效：
  - 首轮给 `img.bg`、`.bg+.content`、`.bg+.content:before/:after` 加 `border-radius: inherit`：WebKit bug [319993](https://bugs.webkit.org/show_bug.cgi?id=319993) 复现注释明确「给带 blur 的子层自身加 border-radius / overflow:hidden 不起作用」；
  - 次轮给父容器 `.article.banner` 与模糊层自身加 `clip-path: inset(0 round 24px)`：用户 Safari 26.5 实测仍漏角，说明 paint 阶段的 clip-path 同样被合成层绕过。
- 根因：`.article.banner` 的 hover 同图模糊层（`.bg+.content:before/:after`，`filter: blur()` + 渐变 `-webkit-mask` + `opacity` 淡入）是 Safari 的合成子层；Safari 26.4/26.5 不把父级 `overflow:hidden` + `border-radius` 的圆角裁剪状态传给该层（WebKit bug 312584/319993，STP 242/249 才修）。
- 依据 WebKit 官方建议（bug 67950，Simon Fraser："Anything that makes the border-radius element a css stacking context should fix this"）与 toFrankie 实践记录：**让圆角父层 `.article.banner` 自身成为层叠上下文并强制合成**，使圆角裁剪在合成层层面作用于全部子层。对照证据：正常工作的文章列表 cover 卡片 `.post-card` 恰好自带 `z-index: 0; position: relative`（层叠上下文）。
- 成功标准：page 页顶部横幅在 Safari hover 时（含动画结束后持续 hover）四角保持圆角、无方角漏出；正常浏览器视觉零变化；模糊层淡入动画、黑色蒙版设计不变。

## 2. 技术方案

- `source/css/_components/partial/article-banner.styl`：`.article.banner` 在保留 `clip-path: 'inset(0 round %s)' % $border-card-l`（正常浏览器裁剪与额外防御）基础上，新增：
  - `isolation: isolate`（语义化层叠上下文）；
  - `transform: translateZ(0)`（强制父层合成，使圆角裁剪在合成层层面裁剪模糊子层）。
  - `.bg+.content:before/:after` 的 clip-path、blur/mask/opacity 动画均不变；移动端（≤667px）维持现有 `clip-path: none`（圆角已归零，无角部问题），`isolation/transform` 无副作用。
- `{% banner %}` 标签、文章列表 cover、置顶轮播、首页横幅均不改动。

## 3. 影响范围

- 对外行为：仅修复 Safari 下 page 页顶部横幅 hover 的角部渲染；正常浏览器中 `isolation`/`transform` 不改变渲染结果，视觉零变化。
- 无新增配置项、无 API 变化；`transform: translateZ(0)` 使 `.article.banner` 成为 fixed 后代的包含块，但横幅内无 fixed 元素，无影响。
- 需要同步的知识库页面：`docs/knowledge/03-内容系统/content-overview.md`（横幅说明），并在 `docs/knowledge/VERIFICATION.md` 更新登记行。

## 4. 验证方式

- 主工程 `npm run g` 全量构建通过。
- 无头浏览器（Chrome）：`.article.banner` computed `isolation: isolate`、`transform` 非 none、`clip-path: inset(0px round 24px)`；`.bg+.content:before/:after` `clip-path` 保持 `inset(0px round 24px)`；hover 后模糊层 opacity 0→1 且无位移；角部像素（距角 2px）hover 前后均为页面背景色；390px 移动端 `clip-path:none`；container 页 3 个 `{% banner %}` 示例不受影响。
- 人工 Safari 26.5 验收（关键步骤）：先 `npm run s` 确认本地最新构建，再在友链/about 等 page 页 hover 顶部横幅——四角保持圆角、无半透明方角（含动画结束后持续 hover）；cover、置顶轮播、`{% banner %}`、首页观感不变。
- `python3 docs/knowledge/tools/verify.py` 知识库硬事实核查。
