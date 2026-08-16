---
title: README 重构检查清单
date: 2026-08-16
---

# 检查清单 / 验证记录

## 验证

- [x] 全部外链可达（文档站 / GitHub / npm / 示例仓库 / Star History / deepwiki；npmjs 网页 403 系反爬，registry API 200 确认包存在）
- [x] 事实核对通过（「博客 + 知识库一体」首屏定位、轻量起步、四大系统、标签组件、数据服务、环境要求、移除「30 个站点」计数）
- [x] `python3 docs/knowledge/tools/verify.py` 知识库硬事实核查通过（行号异常 0、版本不一致 0）
- [x] GitHub 渲染检查：语言切换、徽章、锚点、表格、代码块结构静态复核通过（代码围栏配对、本地链接存在）

## 文档同步

- [x] `docs/designs/2026-08-16-readme-refactor/` 方案文档已建
- [x] 知识库无需更新（README 非 `verify.py` 扫描对象，无行为变更）
- [x] `docs/knowledge/VERIFICATION.md` 无需登记（无知识库偏差修正）
- [x] `languages/` 无需改动（README 不涉及界面文案）
