---
title: 移除 Wiki Hero 底部分隔线
date: 2026-08-19
status: 已实施
---

# 移除 Wiki Hero 底部分隔线方案

## 1. 问题与目标

- Wiki Hero 在 `l_cover` 后额外输出 `<hr>`，导致 Hero 与正文之间出现非预期分隔线。
- 验收标准：Wiki Hero 的渲染结果不再包含该额外 `<hr>`；正文及其它页面的分隔线不受影响。

## 2. 技术方案

- 仅调整 `layout/_partial/cover/wiki_cover.ejs` 的 Hero 收尾 HTML，移除 `<hr>`。
- 不修改样式、脚本、配置或国际化文案。

## 3. 影响范围

- 仅影响启用 `coverpage` 的 Wiki 项目首页。
- 同步更新 Wiki 知识库和核查记录。

## 4. 验证方式

- 检查模板中 Wiki Hero 的收尾 HTML，确认不存在该 `<hr>`。
- 运行知识库硬事实核查。
