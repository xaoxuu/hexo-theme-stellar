---
title: Footer Social 图片图标尺寸修复检查清单
date: 2026-08-20
---

# 检查清单 / 验证记录

## 验证

- [x] 定向尺寸断言通过
- [x] `npm run check` 通过（137 项测试）
- [ ] 原始 `npm run g` 无隔离通过：现有未提交的 `card_hover.enable: true` 引用了尚不存在的 partial，日志出现 `Render HTML failed`
- [x] 临时 `theme_config` 关闭无关 `card_hover` 后，`hexo generate --bail` 全量生成 252 个文件，`gulp minify` 通过
- [x] 编译 CSS 中普通 Social 与 dropdown trigger 共用 `.social` 规则，图片、SVG 均为 24×24px
- [x] 图片使用 `object-fit: contain`，灰阶、透明度、渐变、surface 与菜单规则无差异

## 文档同步

- [x] `docs/knowledge/02-布局系统/sidebar-system.md` 已更新
- [x] `docs/knowledge/VERIFICATION.md` 已登记偏差修正
- [x] 主工程 Stellar Sidebar Wiki 已更新
- [x] 无配置、语言文案或公开接口变更
