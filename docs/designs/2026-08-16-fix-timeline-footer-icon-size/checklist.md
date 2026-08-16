---
title: 修复 timeline 组件页脚评论图标尺寸异常 检查清单
date: 2026-08-16
---

# 检查清单 / 验证记录

## 验证

- [x] 主工程 `npm run g` 全量构建通过
- [x] 产物 CSS 含 `.tag-plugin.timeline[data-api] .body .footer .item svg { width: 1em; height: 1em; vertical-align: -0.125em }`
- [x] 图标与文字对齐复查：先补 `vertical-align: middle`（图标偏低），调整为 `-0.125em`（图标底边略低于基线，视觉中心与数字对齐）
- [x] 本地预览（localhost:4000）文章页返回 200，服务端 CSS 已包含修复规则
- [x] jsdom 计算样式对照：无规则时 SVG 不缩（保留 32px 属性），有规则时计算尺寸为 `1em`，覆盖内联 `width="32" height="32"`
- [ ] 浏览器视觉抽查：评论图标约 13px（1em）、与文字/emoji 基线对齐、徽章高度不再被撑大（本会话无浏览器控制工具，留待用户预览确认）
- [ ] 侧边栏 timeline widget（`source/_data/widgets.yml`）footer 场景抽查（当前站点侧栏 timeline 配置 `hide: footer`，实际展示场景为文章页）
- [ ] 浏览器兼容性：Chrome / Safari 抽查（可选）
- [x] 纯 CSS 改动，无需单测与 `python3 docs/knowledge/tools/verify.py`（未改知识库源码事实）

## 文档同步

- [ ] `docs/knowledge/` 无需更新（未描述页脚图标尺寸）
- [ ] `docs/knowledge/VERIFICATION.md` 提交登记（仅在用户要求提交时补充）
- [ ] `languages/` 无需改动
