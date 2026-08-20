---
title: 全局卡片 Hover 光效与倾斜检查清单
date: 2026-08-20
---

# 检查清单 / 验证记录

## 验证

- [x] `npm run lint` 通过
- [x] `npm test` 通过
- [x] 主工程 `npm run g` 全量构建通过
- [x] 首页 / Wiki / 文章 link-grid 页面检查通过
- [x] UI Collection 的 list/grid/summary 与 glass/card/sidebar/content 四种 surface 检查通过
- [x] 公共 collection 与两套 dropdown 均只输出 Spotlight 组合类，不输出 Tilt
- [x] 浅色 active、深色键盘焦点、dropdown 浮层鼠标跟随与离开复位检查通过
- [x] TOC/搜索 `.ui-collection-adapter` 保持排除
- [x] 笔记本 / 笔记模板结构与组合类通过静态核验（主站当前未配置 notebook 数据，无可访问列表页）
- [x] `python3 docs/knowledge/tools/verify.py` 通过
- [x] 浅色与深色主题浏览器检查通过
- [x] 减少动态效果与非精细指针降级通过客户端自动化测试
- [x] Spotlight 在最后指针位置淡出，完成后才回中；Tilt 离开时立即归零
- [x] 快速重新进入与键盘焦点不会被旧的淡出结束事件覆盖
- [x] `destroy()`、页面隐藏与媒体条件变化仍完整复位并清理新增监听器
- [x] 置顶轮播外层输出完整组合类，内部轨道切换、自动暂停、圆点和左右按钮保持正常
- [x] 专栏列表仅最新文章封面输出完整组合类，标题、描述和归档式文章列表不倾斜

## 文档同步

- [x] `docs/knowledge/` 对应领域已更新
- [x] `docs/knowledge/VERIFICATION.md` 已登记
- [x] 主仓库 `source/wiki/stellar/advanced-settings.md` 已更新
- [x] 无需新增 `languages/` 文案
