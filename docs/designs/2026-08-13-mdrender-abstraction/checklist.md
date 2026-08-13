---
title: 远程 MD 渲染能力抽象 + Wiki README 主页 检查清单
date: 2026-08-13
---

# 检查清单 / 验证记录

## 验证

- [x] `npm run lint` 通过
- [x] `npm test` 通过（新增 `test/mdrender.test.js`：底层占位/镜像/解析 + wiki 应用判定/URL/占位组合 + slug 规则）
- [x] `python3 docs/knowledge/tools/verify.py` 知识库硬事实核查通过
- [x] 在主工程执行 `npm run g` 全量构建通过（涉及 `scripts/` 必做）
- [x] 页面类型覆盖：Wiki 页（含 `/wiki/star-vote/` README 主页）、普通 Wiki 页、文章页

## 行为核验点

- [x] `{% md %}` 输出容器结构与现状一致，仅新增 `data-heading="true"`
- [x] `{% md %}` 默认（wrap 缺省/true）保留容器；`wrap:false` 输出 `data-replace`（无外部容器）
- [x] GitHub raw src 使用 `api_host.ghraw`（配置为唯一默认值来源）并输出 `data-base`
- [x] 非 GitHub src 原样输出、无 `data-base`
- [x] 原地替换模式渲染后无外部容器（最终 DOM 由客户端替换，构建产物为占位）
- [x] 标题规范化：README h1 直接隐藏（页面标题由 banner 展示）、其余标题补 id、追加 `headerlink` 锚点、与页面已有 id 冲突加后缀（单测覆盖 slug 规则；jsdom 模拟核验 DOM 行为）
- [x] wiki 首页正文为空（仅空白/换行）时触发 README；正文非空时不触发
- [x] 远程内容渲染后派发 `stellar:mdrender` 事件，main.js 重建右侧 TOC（层级嵌套、编码链接、点击滚动，jsdom 加载真实 main.js 端到端核验）
