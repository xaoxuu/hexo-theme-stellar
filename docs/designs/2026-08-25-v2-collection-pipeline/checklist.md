---
title: Stellar v2 Collection Pipeline 与 Notebook 复核检查清单
date: 2026-08-25
issue: 723
---

# 检查清单 / 验证记录

## 行为与架构

- [x] Post、Wiki、Topic、Notebook 行为矩阵由可执行 fixture 覆盖。
- [x] 事件层只有一个 Collection Pipeline 构建入口。
- [x] profile 注册表封闭且 adapter 只保留产品差异。
- [x] 内容发现、归属与分组为单遍线性流程。
- [x] Topic/Notebook 共用 two-stage 协议。
- [x] Wiki/Notebook 共用 listed + tag filter + pagination 输入原语，导航模型保持分离。
- [x] Notebook 三层旅程、隐藏项、置顶、recent、标签路由和分页保持不变。

## CLI

- [x] `stellar new note` dry-run 与真实写入消费同一文件计划。
- [x] 未知 Notebook、非法标题、路径越界和已有目标均拒绝且无残留。
- [x] 生成最小 Front Matter，不写可由路径唯一推断的 Collection 归属字段。
- [x] 生成结果通过 doctor 与 generate。

## 验证

- [x] `npm run check` 通过：lint、395 项测试、Reference、首屏 gzip 46.5581%、知识库与提交登记均通过。
- [x] `npm run integration:check` 三套 tarball 集成通过；minimal-reading 真实执行 `stellar new note` 后通过 doctor 与 generate。
- [x] `python3 docs/knowledge/tools/verify.py` 硬门禁通过：行号与版本异常均为 0；既有软提示保持可见。
- [x] 主工程 `npm run g` 通过，生成 261 个文件；Post / Wiki / Topic 真实内容正常，Notebook 由 Alpha fixture 覆盖。
- [x] Standards / Spec 双轴自审无剩余 finding；复审中修正 Wiki/Notebook adapter 二次读取全量 pages 的偏差。

## 文档与状态

- [x] `docs/knowledge/03-内容系统/` 已按真实 Pipeline 更新。
- [x] `docs/knowledge/VERIFICATION.md` 已登记本切片及历史 #732 缺失台账。
- [x] 主工程 `spec.md` / `plan.md` / `checklist.md` 只将 M7 的真实证据标记完成。
- [x] 新公开配置、URL、CSS、浏览器 API、迁移/SEO 跳转、npm 发布和 tag 均记录为 N/A。
