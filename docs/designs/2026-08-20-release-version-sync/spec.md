---
title: 发版版本同步门禁修复
date: 2026-08-20
status: 已实施
---

# 发版版本同步门禁修复方案

## 1. 问题与目标

- `release.js` 在写入新版本号前执行 `npm run check`，且只更新 `_config.yml` 与 `package.json`；发版提交因此可能保留知识库中的旧版本号，并在推送后的 CI 才失败。
- 1.43.0 已成功发布，本次只修复主分支 CI 与后续发版流程，不重新发布、不移动 tag 或 GitHub Release。
- 成功标准：发版准备同时更新配置、包版本和安装知识库；质量检查针对最终待提交状态运行；失败、取消和 dry-run 均完整恢复文件。

## 2. 技术方案

- 复用现有 `release.js` 的文件备份、恢复、CHANGELOG 校验与 `npm run check` 入口，不新增依赖。
- 将版本文件准备抽成可测试函数：先读取并验证全部输入，在内存中生成 `_config.yml`、`package.json` 与 `docs/knowledge/00-总览与安装配置/installation.md` 的新内容，全部成功后再统一写入。
- 安装知识库只替换与当前 `package.json` 完全相同的版本号；找不到旧版本时中止，避免静默产生不一致的发版提交。
- 文件准备完成后再运行 `npm run check`；检查失败由现有恢复流程回滚全部受管文件。
- 发版 diff、暂存和提交范围同步纳入安装知识库，工作区的发版前白名单保持不变，避免顺带提交预先存在的安装文档改动。

## 3. 影响范围

- 修改 `release.js`、发版单测、安装知识库与发版指南。
- 新增本方案的 spec、plan、checklist。
- 不修改 npm 发布 workflow，不影响主题运行时、公开配置、页面渲染或主站 Wiki。

## 4. 验证方式

- 回归单测覆盖多处版本替换、无关版本保留、旧版本缺失拒绝和写入前失败不产生部分更新。
- 执行 `node --test test/release.test.js`、`npm run check` 与 `python3 docs/knowledge/tools/verify.py`。
- 推送主题 `main` 后等待新 CI 全部通过，并再次确认 npm latest、1.43.0 tag 与 GitHub Release 未变化。
