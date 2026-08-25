---
title: 侧边栏圆角层曲率对齐检查清单
date: 2026-08-25
---

# 检查清单 / 验证记录

## 验证

- [x] 回归测试在修复前因伪元素缺少 `corner-shape: inherit` 失败；失败输出中的共用伪元素规则不含该声明。
- [x] 定向回归测试在修复后通过；`appearance-final-convergence.test.js` 全部 6 项通过。
- [x] 主题仓库 `npm run check` 通过：Node.js 22 下 426 项测试通过，Schema 与性能门禁通过。
- [x] `python3 docs/knowledge/tools/verify.py` 通过：行号错误与版本不一致均为 0；34 个未解析文件引用和 13 个未解析配置键为仓库既有提示。
- [x] 主工程 `npm run g` 通过：生成 262 个文件，HTML、CSS 与 JS 压缩完成。
- [x] Chrome 桌面端浅色/暗色 × 有图/无图四种组合通过：四层计算曲率均为 `superellipse(1.25)`，无图场景背景图为 `none`，有图场景高光和遮罩仍生效，四角未见亮沿。

## 文档同步

- [x] 最终功能 diff 中的行为、配置、API、UI 与兼容性变化均有文档落点。
- [x] `docs/knowledge/02-布局系统/sidebar-system.md` 已更新。
- [x] `docs/knowledge/VERIFICATION.md` 已登记。
- [x] 公开 Wiki 连续曲率说明已更新，并刷新正文 `updated`。
- [x] 功能、测试、文档、方案状态与验证记录已准备作为同一个交付单位。
