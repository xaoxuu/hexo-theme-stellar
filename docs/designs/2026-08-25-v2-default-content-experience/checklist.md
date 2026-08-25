---
title: v2 空配置与最小内容默认体验验收
date: 2026-08-25
---

# 检查清单 / 验证记录

## 行为

- [x] 缺失与空 `_config.stellar.yml` 均通过 doctor/build。
- [x] 普通 Post/Page 不需要 Stellar Front Matter。
- [x] Wiki tree/路径、Topic `route.start`、Notebook 路径唯一推断通过。
- [x] 零匹配、多重匹配和显式声明冲突包含来源、候选与最小修复。
- [x] 标题、摘要、封面、作者、日期、标签、导航、SEO、许可、评论与 Extension 降级确定。
- [x] Blueprint/Style 无冗余默认字段，starter Markdown 覆盖常用语法且无可选元数据。

## 验证

- [x] Node.js 22 `npm run check` 通过（411 项测试）。
- [x] Node.js 22 `npm run integration:check` 通过三套 Blueprint 与默认空配置站点。
- [x] 主工程 `npm run g` 全量构建通过（262 个文件）。
- [x] `python3 docs/knowledge/tools/verify.py`、Reference 与首屏性能门禁通过（gzip 降幅 46.5581%）。
- [x] Standards / Spec 最终自审无剩余 finding。

## 边界

- [x] 知识库与 `VERIFICATION.md` 已同步。
- [x] 新公开配置、URL、DOM、CSS、语言文案、公共浏览器 API、依赖、迁移/SEO、npm/tag 均为 N/A。
- [x] 只声明 M9 完成；M10 与 Alpha 1 保持未完成。
