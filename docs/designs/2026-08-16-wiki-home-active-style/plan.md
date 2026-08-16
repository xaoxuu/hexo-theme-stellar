---
title: wiki 内页左上角返回按钮背景复用目录树激活样式 执行计划
date: 2026-08-16
---

# 执行计划

## 实施步骤

1. [x] `source/css/_components/sidebar/logo.styl`：`.wiki-home` 基础 `background: var(--bg-a50)` → `sidebar-light()`
2. [x] 新建 `docs/designs/2026-08-16-wiki-home-active-style/` 方案文档（spec / plan / checklist）
3. [x] 同步 `docs/knowledge/02-布局系统/sidebar-system.md` 与合并版 `docs/knowledge/知识库全量.md`
4. [x] `docs/knowledge/VERIFICATION.md` 登记
5. [x] `python3 docs/knowledge/tools/verify.py` 知识库硬事实核查（退出码 0，行号异常 0、版本不一致 0）
6. [ ] 按需主工程 `npm run s` 预览（浅色/深色、glass/card、移动端）

## 风险与回退

- 风险：`sidebar-light()` 依赖容器级变量，站点若覆盖变量可能导致背景与预期不同；回退：恢复 `background: var(--bg-a50)`。
- 光照效果按设计无过渡动画，hover 不再有背景变化，仅文字颜色变化。
