---
title: 方案名称检查清单
date: YYYY-MM-DD
---

# 检查清单 / 验证记录

## 验证

- [ ] `npm run lint` 通过
- [ ] `npm test` 通过（新增/修改纯函数的单测）
- [ ] 在主工程执行 `npm run g` 全量构建通过（涉及 `scripts/` 必做）
- [ ] 页面类型覆盖：首页 / 文章页 / Wiki 页 / 错误页等
- [ ] `npm run knowledge:check` 知识库硬事实门禁通过
- [ ] 浏览器兼容性检查

## 文档同步

- [ ] 最终功能 diff 中的行为、配置、API、UI 与兼容性变化均有文档落点
- [ ] 说明、示例、字段名、默认值、边界与失败行为和最终实现一致
- [ ] `docs/knowledge/` 对应领域已更新
- [ ] `docs/knowledge/VERIFICATION.md` 已登记偏差修正
- [ ] `languages/` 文案（如需）
- [ ] 功能、测试、文档、方案状态与验证记录已准备作为同一个交付提交
