---
title: 激活指示小圆点检查清单
date: 2026-08-15
---

# 检查清单 / 验证记录

## 验证

- [ ] `npm run check` 通过
- [ ] 主工程 `npm run g` 全量构建通过
- [ ] `python3 docs/knowledge/tools/verify.py` 知识库硬事实核查通过
- [ ] 页面类型覆盖：Wiki 页（左侧树）、文章/专栏页（右侧相关）、友链/链接列表页
- [ ] 视觉验收：wiki 切换页面无抖动/闪烁，激活项显示 8px 渐变圆点；无 JS 时圆点正常显示
- [ ] 回归：搜索、菜单、leftbar 渐变、TOC、异步图标加载器不受影响

## 文档同步

- [x] `docs/knowledge/VERIFICATION.md` 已登记
- [x] 主工程 `source/wiki/stellar/sidebar.md` 已同步
