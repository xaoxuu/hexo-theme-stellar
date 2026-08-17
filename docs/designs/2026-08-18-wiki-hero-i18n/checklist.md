---
title: Wiki Hero 内置文案多语言化检查清单
date: 2026-08-18
---

# 检查清单 / 验证记录

## 验证

- [x] 三份 `languages/*.yml` 键集一致（99 个键）
- [x] `wiki_cover.ejs` 内置文案均经 `__()` 输出；构建产物的 zh-CN 文案正确
- [x] 主工程 `npm run g` 全量构建通过
- [x] `python3 docs/knowledge/tools/verify.py` 通过（行号异常、版本不一致均为 0；未解析文件与既有配置键报告不阻断）

## 文档同步

- [x] `docs/knowledge/08-本地化/localization.md` 已更新
- [x] `docs/knowledge/03-内容系统/wiki-docs.md` 已更新
- [x] `docs/knowledge/VERIFICATION.md` 已登记
- [x] 主工程 `source/wiki/stellar/wiki-settings.md` 已更新
