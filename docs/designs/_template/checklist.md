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
- [ ] `python3 docs/knowledge/tools/verify.py` 知识库硬事实核查通过
- [ ] 浏览器兼容性检查

## 文档同步

- [ ] `docs/knowledge/` 对应领域已更新
- [ ] `docs/knowledge/VERIFICATION.md` 已登记偏差修正
- [ ] `languages/` 文案（如需）
