---
title: 跨文档页面过渡检查清单
date: 2026-08-20
---

# 检查清单 / 验证记录

## 验证

- [ ] `npm run check` 通过（lint 与 135 项单测通过；最后被仓库已有的 11 个未登记历史提交拦截）
- [x] 主工程 `npm run g` 全量构建通过
- [x] `python3 docs/knowledge/tools/verify.py` 知识库硬事实核查通过
- [x] 默认配置输出 `@view-transition` 与 `leftbar` 命名区域
- [x] 关闭配置不输出页面过渡规则
- [ ] 首页 / 文章页 / Wiki 页 / 分类页切换检查
- [ ] 前进后退、深浅色、页内锚点与跨域链接检查
- [x] 减少动态效果规则随构建产物输出
- [x] 不支持跨文档过渡的内置浏览器中，首页到分类页完整导航和相同左栏内容正常
- [ ] Chromium / Safari 支持路径与实际动效观感人工验收

内置浏览器未暴露 `CSSViewTransitionRule`，无法验证支持路径；尝试连接本机 Chrome 时当前环境未提供可用实例。该项保留给真实支持浏览器人工确认，不以静态检查替代。

## 文档同步

- [x] `docs/knowledge/07-外部集成/pjax-navigation.md` 已更新
- [x] `docs/knowledge/VERIFICATION.md` 已登记
- [x] 主工程 Wiki 高级设置已更新
- [x] 无需新增国际化文案
