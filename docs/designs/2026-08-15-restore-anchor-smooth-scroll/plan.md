---
title: 恢复标题锚点等页内链接的平滑滚动执行计划
date: 2026-08-15
---

# 执行计划

## 实施步骤

1. [x] `source/js/main.js`：新增 `bindAnchorClick` 文档级委托监听（同页 `#` 链接走 `smoothScrollTo`，32px 偏移、`#start` 贴顶、`pushState` 更新 URL），模块作用域注册一次。
2. [x] 文档同步：本方案目录（spec.md / plan.md / checklist.md）+ `docs/knowledge/05-前端交互/toc-system.md` + `docs/knowledge/VERIFICATION.md` 登记。
3. [x] 主工程 `docs/specs/restore-anchor-smooth-scroll/spec.md`（AGENTS.md §8.1）。
4. [ ] 验证：构建 + 手动浏览器检查（见 checklist.md）。

## 风险与回退

- 风险：文档级委托可能与其他锚点处理器重复滚动——通过 `e.defaultPrevented` 前置跳过规避，已确认 TOC/tabs/tagtree/wiki 封面按钮均在自身处理器中 `preventDefault`。
- 回退：移除 `bindAnchorClick` 调用即可完全回退；不触碰 `defines.ejs` 的初始 hash 定位逻辑。
