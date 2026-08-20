---
title: 搜索结果可点击区域背景与 Hover 动效检查清单
date: 2026-08-21
---

# 检查清单 / 验证记录

## 功能

- [x] 本地搜索标题位于链接外，链接默认显示 surface 玻璃高亮且只组合 Spotlight
- [x] Algolia 标题位于链接外，链接默认显示 surface 玻璃高亮且只组合 Spotlight
- [x] 结果替换与清空前卸载旧卡片，插入后挂载新卡片
- [x] 插件关闭、粗指针和减少动态效果时保留静态搜索行为

## 验证

- [x] `npm run check` 通过（164 项测试）
- [x] `python3 docs/knowledge/tools/verify.py` 通过
- [x] 主工程 `npm run g` 通过（254 个页面）
- [x] dark/auto + glass 本地交互验证；light/card 的 surface 映射经样式回归与构建产物核对；hover 无 Tilt

## 文档同步

- [x] `docs/knowledge/` 对应领域已更新
- [x] `docs/knowledge/VERIFICATION.md` 已登记
- [x] 主工程 `source/wiki/stellar/` 已同步并刷新 `updated`
