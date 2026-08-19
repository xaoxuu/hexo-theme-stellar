---
title: 侧边栏集合组件重构检查清单
date: 2026-08-19
---

# 检查清单 / 验证记录

## 实施

- [x] 公共 partial 与 surface 令牌完成
- [x] 列表/网格组件迁移完成
- [x] TOC/search adapter 完成
- [x] 配置、知识库、主仓库 Wiki 与预览同步

## 验证

- [x] `npm run lint` 通过
- [x] 主工程 `npm run g` 通过；正式构建 252 个文件，草稿预览未进入产物
- [x] `python3 docs/knowledge/tools/verify.py` 通过；报告仅保留既有 47 个未解析文件与 11 个配置键提示
- [x] 首页 / 文章页 / Wiki 页 / 笔记本页构建结构检查；单页 Wiki 空集合正常跳过
- [x] glass / card / sidebar / content 浏览器预览检查
- [x] 240px / 320px / 720px、375px 移动视口与明暗主题检查；无横向溢出，网格自动降列且标题可见
- [x] active / hover / focus-visible 检查
- [x] 旧位置耦合选择器静态检查；迁移模板和样式未出现 `.l_left .widget...`、`.l_right .widget...` 或侧栏 `.post-list/.post-card`
- [x] tagtree 展开选择器、TOC collapse、左栏滚动恢复与运行时 adapter 选择器检查
- [x] menubar 标题使用 `$fs-15`，菜单项间距为 `2px`，覆盖范围仅限 `.nav-area .menu`
- [x] collection、tree、TOC、search、markdown 与 preview 的普通 margin/padding/gap 已按 `2 / 4 / 8 / 12 / 16 / 24 / 32px` 刻度复核；尺寸、描边、最小高度与共享 widget header 光学对齐值按设计保留
- [x] TOC 静止激活项背景透明且无阴影，激活文字与左侧 `4px` 宽指示条保留，指示条上下 inset 为 `4px`；激活项悬停时显示普通 hover 效果
