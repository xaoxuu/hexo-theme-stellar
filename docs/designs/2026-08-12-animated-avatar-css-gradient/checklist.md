---
title: 头像彩虹光环 CSS 渐变检查清单
date: 2026-08-12
---

# 检查清单 / 验证记录

## 验证

- [ ] 主题仓库 `npm run lint` 通过
- [ ] 主题仓库 `npm test` 通过（无新增纯函数，预期无影响）
- [ ] 主工程 `npm run g` 全量构建通过（涉及模板与配置改动必做）
- [ ] 页面类型覆盖：首页（左栏头像）、移动端头部 logo、`animate: always` / `auto` / 关闭三种配置
- [ ] `python3 docs/knowledge/tools/verify.py` 知识库硬事实核查通过
- [ ] 浏览器兼容性：conic-gradient 主流浏览器支持

## 文档同步

- [x] `docs/designs/2026-08-12-animated-avatar-css-gradient/` 方案文档已建
- [ ] `docs/knowledge/` 对应领域已更新
- [ ] `docs/knowledge/VERIFICATION.md` 已登记变更
- [ ] 主仓库 `source/wiki/stellar/sidebar.md` 动态头像说明已同步
- [ ] `languages/` 文案（无新增文案，无需改动）
