---
title: 补充贡献说明文档检查清单
date: 2026-08-13
---

# 检查清单 / 验证记录

## 验证

- [x] 主题仓库 `npm run check` 通过（lint + 单测 + 知识库核查，退出码 0）
- [x] 主工程 `npx hexo generate` 通过（37 files），Wiki 贡献页 `public/wiki/stellar/contributors/index.html` 渲染无报错
- [x] 链接检查：GitHub `CONTRIBUTING.md` URL、docs 仓库 URL、README 相对链接格式正确（推送到 GitHub 前远端 URL 暂不可访问，属预期）

## 文档同步

- [ ] `docs/knowledge/` 无需更新（纯文档改动）
- [ ] `docs/knowledge/VERIFICATION.md` 无需登记
- [x] Wiki 页（docs 子模块 `contributors.md`）与主题仓库 `README.md` 已更新

## 提交

- [x] 不自动提交，改动保留在各自仓库工作区供审查
