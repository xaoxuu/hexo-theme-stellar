---
title: 背景图 URL 渲染修复检查清单
date: 2026-08-25
---

# 检查清单 / 验证记录

## 验证

- [x] 回归测试修复前命中 `url(''…'')`（新增测试 5 项中仅此项失败）
- [x] `node --test test/appearance-final-convergence.test.js` 通过（5/5）
- [x] Node.js 22 下 `npm run check` 通过（425 项测试、Schema、性能与知识库核查）
- [x] 主工程 `npm run g` 通过（262 个文件生成并完成 minify）
- [x] 生成 CSS 不包含双重引号 URL，侧栏输出有效 `url(https://…)`
- [x] 首页 / 文章页 / Wiki 页保持 `data-ui-surface="glass"`
- [x] 深色模式浏览器计算样式为有效背景 URL；浅色模式由相同无条件 `background-image` 规则和真实编译回归测试覆盖

## 文档同步

- [x] `docs/knowledge/VERIFICATION.md` 已登记偏差修正
- [x] 公开配置与行为契约未变化，无需同步公开 Wiki
- [x] 方案状态与验证记录已更新
