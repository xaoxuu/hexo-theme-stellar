---
title: 本地搜索定位与高亮检查清单
date: 2026-08-15
---

# 检查清单 / 验证记录

## 验证

- [x] `npm run lint` 通过
- [x] `npm test` 通过（新增 `test/search_index.test.js`，8 个用例全绿）
- [x] 在主工程执行 `npm run g` 全量构建通过（247 文件生成 + minify 完成）
- [x] 页面类型覆盖：文章页 / Wiki 页 / 无标题页 / 首页（构建产物抽查）
- [x] `python3 docs/knowledge/tools/verify.py` 知识库硬事实核查通过（仅既有非阻断项）
- [x] 浏览器兼容性检查（无头 Chrome + CDP 实测：高亮加载、黄色 mark 包裹、intro 滚动定位、章节锚点 32px 定位）

## 手工验收

- [x] 文章页搜索：结果按章节出现，显示页面标题 + 章节名（客户端逻辑仿真验证）
- [x] Wiki 页搜索：路径过滤正常，点击跳转对应章节（锚点与构建页面 id 交叉验证，0 缺失）
- [x] 目标页关键词黄色高亮，`#` 锚点定位准确（实测：heading 视口 top=32px，3 处高亮）
- [x] intro 段命中：结果无锚点，高亮后滚动到第一个匹配词（实测：scrollY 定位到首个 mark 上方 32px）
- [x] 旧缓存（无 `anchors`）回退页面级行为；缓存键 v4 生效（修复 `window.utils` 判断导致 highlight.js 未加载的问题）
- [x] 多关键词、无标题页、无结果状态正常（逻辑仿真验证）

> 注：真实浏览器点击交互建议用户通过 `npm run s` 预览最终确认。

## 文档同步

- [x] `docs/knowledge/07-外部集成/search.md` 已更新
- [x] `docs/knowledge/知识库全量.md` 已更新
- [x] `docs/knowledge/VERIFICATION.md` 已登记
- [x] 主仓库 `source/wiki/stellar/sidebar.md` 已同步（`updated` 刷新为 2026-08-15 21:30）
