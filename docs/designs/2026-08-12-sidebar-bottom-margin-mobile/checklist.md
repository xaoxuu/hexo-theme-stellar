---
title: 侧边栏底部间距改为仅手机端生效 检查清单
date: 2026-08-12
---

# 检查清单 / 验证记录

## 验证

- [x] `npm run check` 通过（lint + 9 单测 + 知识库核查，行号异常 0、版本不一致 0）
- [x] 主工程 `npm run g` 全量构建通过（hexo generate + gulp minify，204 文件）
- [x] `python3 docs/knowledge/tools/verify.py` 知识库硬事实核查通过（行号异常 0、版本不一致 0）
- [ ] 页面类型覆盖：首页 / 文章页 / Wiki 页（PC 与移动端视口，待用户预览确认）
- [x] `rg` 确认两个新变量仅出现在移动端媒体查询与知识库文档中；生成 CSS 中旧公式（32/48px）为 0 处，新公式（PC 上下 `var(--gap-margin)` ×3、移动端 8pt+64px ×3）均就位

## 文档同步

- [x] `docs/knowledge/02-布局系统/sidebar-system.md` 已更新
- [x] `docs/knowledge/知识库全量.md` 已更新
- [x] `docs/knowledge/VERIFICATION.md` 已登记变更
- [ ] `languages/` 文案（本次不涉及）
