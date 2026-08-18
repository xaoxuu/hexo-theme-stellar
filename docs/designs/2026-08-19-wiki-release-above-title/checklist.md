---
title: Wiki Hero 版本标签移至标题上方检查清单
date: 2026-08-19
---

# 检查清单 / 验证记录

## 验证

- [x] `.wiki-cover-release.ds-ghinfo` 在模板中位于 `.cover-title` 之前。
- [x] 版本标签的 GitHub API、项目名、仓库、加载类和外链属性保持不变。
- [x] `npm run g` 主工程全量构建与 minify 通过。
- [x] `python3 docs/knowledge/tools/verify.py` 知识库硬事实核查通过（仅报告仓库既有未解析文件/配置键异常；无行号或版本不一致）。
- [x] 生成的 `public/wiki/stellar/index.html` 中，版本标签位于项目标题上方。

## 文档同步

- [x] `docs/knowledge/03-内容系统/wiki-docs.md` 已更新。
- [x] `docs/knowledge/VERIFICATION.md` 已登记。
- [x] 无新增配置或文案。
