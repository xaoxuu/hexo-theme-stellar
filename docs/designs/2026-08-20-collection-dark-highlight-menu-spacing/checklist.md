---
title: Collection 深色高亮与菜单间距收敛检查清单
date: 2026-08-20
---

# 检查清单 / 验证记录

- [x] `npm run lint` 通过。
- [x] `python3 docs/knowledge/tools/verify.py` 通过（行号异常 0、版本不一致 0）。
- [x] 主工程 `npm run g` 通过（252 个文件生成并完成 HTML/CSS/JS 压缩）。
- [x] 深色显式模式与跟随系统深色的 glass hover/active 均使用 `var(--bg-a20)` 基底。
- [x] nav-area 不再覆盖 `--ui-collection-gap`，menubar 继承 `auto` collection 默认 4px 间距。
- [x] card/sidebar/content surface 与 compact density 源码未改动。
