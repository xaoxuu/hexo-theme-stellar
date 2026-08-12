---
title: 补充贡献说明文档执行计划
date: 2026-08-13
---

# 执行计划

## 实施步骤

1. [x] 建方案文档（`docs/designs/2026-08-13-contribution-guide/`，spec / plan / checklist）
2. [x] 新增 `CONTRIBUTING.md`（详细版，简体中文）
3. [x] `README.md` 反馈区追加本地 `CONTRIBUTING.md` 链接（保留 Wiki 贡献页链接）
4. [x] docs 仓库 `source/wiki/stellar/contributors.md` 新增「如何贡献」小节并链接 GitHub 指南
5. [x] 验证：主题仓库 `npm run check` 通过、主工程 `npx hexo generate` 通过并确认 Wiki 页渲染、链接格式检查通过

## 风险与回退

- Wiki 页新增内容使用与现有页面一致的标签与 markdown 链接；若渲染异常，回退为纯 markdown 链接
- docs 子模块改动仅存在于工作区，随时可 `git checkout -- contributors.md` 回退（仅该文件）
- 不自动提交、不 push，改动保留在工作区供用户审查
