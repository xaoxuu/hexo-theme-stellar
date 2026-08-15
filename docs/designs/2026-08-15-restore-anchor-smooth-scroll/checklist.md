---
title: 恢复标题锚点等页内链接的平滑滚动检查清单
date: 2026-08-15
---

# 检查清单 / 验证记录

## 验证

- [x] 主工程 `npm run g` 全量构建通过（`public/js/main.js` 包含 `bindAnchorClick`）
- [x] `npm run lint` 通过
- [x] `npm test` 通过（83/83）
- [x] `python3 docs/knowledge/tools/verify.py` 通过（exit=0，仅既有未解析文件/配置键提示）
- [ ] 技术文章页：点击标题左侧 `.headerlink` 平滑滚动到目标（32px 偏移），URL hash 更新
- [ ] 含 `{% navbar %}` 的页面：页内导航链接平滑滚动
- [ ] 回归：TOC 点击、回到顶部、参与讨论、wiki `#start` 按钮行为不变
- [ ] 回归：tabs 标签切换、tagtree 折叠不受影响
- [ ] 带 `#锚点` URL 初始打开：仍为直接定位无动画（`defines.ejs` 未改动）

## 文档同步

- [x] `docs/knowledge/05-前端交互/toc-system.md` 已更新
- [x] `docs/knowledge/VERIFICATION.md` 已登记
- [x] `source/wiki/stellar/` 核对：无需同步（无相关行为描述）
