---
title: 搜索框键盘快捷键检查清单
date: 2026-08-21
---

# 检查清单 / 验证记录

## 验证

- [x] `npm run check` 通过（lint、164 项测试、知识库核查、提交登记检查）
- [x] 主工程 `npm run g` 全量构建通过（254 个文件）
- [x] `Command+K` / `Ctrl+K` 桌面聚焦行为通过
- [x] 窄屏、编辑区域、输入法组合、无搜索框与错误按键降级通过
- [x] 首页 / 文章页 / Wiki 页生成产物含唯一共享脚本引用
- [x] Chromium 桌面与 600px 窄屏交互抽查通过；仅观察到原有外部数据请求的 `utils.js:335 响应失败`，与本功能无关

## 文档同步

- [x] `docs/knowledge/02-布局系统/sidebar-system.md` 已更新
- [x] `docs/knowledge/07-外部集成/search.md` 已更新
- [x] 主工程 `source/wiki/stellar/sidebar.md` 已更新并刷新 `updated`
- [ ] 功能提交后在 `docs/knowledge/VERIFICATION.md` 登记短 SHA
- [x] 无需新增配置、样式、依赖或 `languages/` 文案
