---
title: img_lazyload 正则越界修复执行计划
date: 2026-08-17
---

# 执行计划

## 实施步骤

1. [x] 重写 `scripts/filters/lib/img_lazyload.js`：属性感知标签扫描 + 跳过脚本/样式/注释 + 保留跳过规则与输出形态；导出 `lazyProcess`。
2. [x] 新增 `test/img_lazyload.test.js`（16 用例，含回归用例），单测通过。
3. [x] `layout/_partial/scripts/bootstrap.ejs`：补载脚本改用 `s.setAttribute('src', ...)`。
4. [x] `layout/_plugins/index.ejs`：新增 `stellar.initPlugin` 兜底 shim。
5. [x] 设计文档与知识库同步：`docs/designs/2026-08-17-img-lazyload-regex-fix/`、`05-前端交互/client-side-overview.md`、`07-外部集成/plugin-system.md`、`09-高级主题/performance.md`、`VERIFICATION.md`、`CHANGELOG.md`（1.42.1 章节）。
6. [ ] 验证：`npm run check`、主工程 `npm run g`、penndu/hexo 回归构建 + 无头浏览器检查，结果登记 `checklist.md`。
7. [ ] 发版：向用户确认 1.42.1 版本号与变更摘要后 `npm run release:dry -- 1.42.1` → `npm run release -- 1.42.1`。

## 风险与回退

- **正则/扫描器回归**：已用 16 个单测覆盖主要形态；如站点产物异常，可临时恢复 v1 实现（回退 commit），但需注意 v1 在 hexo-minify 组合下会再次损坏 bootstrap。
- **兜底 shim 与 bootstrap 重复定义**：shim 仅在 `stellar.initPlugin` 缺失时生效，正常路径为空操作；与 bootstrap 的 `window.stellar = window.stellar || {}` 合并语义兼容。
- **ScrollReveal CDN 不可用**：保持现状，3 秒 `sr-fallback` 看门狗兜底；本地化因 GPL-3.0 许可冲突不纳入本次。
