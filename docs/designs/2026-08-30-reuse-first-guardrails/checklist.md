---
title: 复用优先与硬编码防护检查清单
date: 2026-08-30
---

# 检查清单 / 验证记录

## 契约

- [x] capability 注册表、默认值、顺序、修饰类、冻结与未知能力报错有单测。
- [x] EJS、标签插件与浏览器动态节点消费同一注册表。
- [x] 受管控件和 plain-link 例外均有稳定登记。
- [x] checker fixture 覆盖六类正反场景。
- [x] `npm run reuse:check` 已接入 `npm test`。

## 验证

- [x] `npm run reuse:check`
- [x] capability、checker、Brand、Collection、Dropdown、Region、Search、Settings 定向测试
- [x] 四种 Appearance 的 `ui-interactive` 编译与交互契约通过。
- [x] `npm run check` 已执行；新增门禁和受影响契约通过，7 条既有 Appearance、Brand 尺寸与 Shell 几何基线失败，未在本任务修改。
- [x] `npm run schema:check` 通过；Node 22 的 `performance:check` 命中工作树既有 `performance-baseline.json` 漂移，未覆盖用户基线。
- [x] 主工程 `npm run g` 通过。
- [x] Brand Stats 实际页面验证：三项均挂载 Spotlight；hover 消费 Appearance 背景与 inset shadow；focus-visible 输出 2px theme outline 和 0.6 Spotlight。
- [x] 纯 `interactive` 的搜索关闭按钮没有挂载 Spotlight。

## 文档边界

- [x] 当前内部方案与执行边界已记录。
- [x] AGENTS 与 `stellar-theme-dev` 已加入可检查的复用审计完成条件。
- [x] 本次无公开配置、Schema、Front Matter、知识库、Wiki 或 CHANGELOG 更新。
