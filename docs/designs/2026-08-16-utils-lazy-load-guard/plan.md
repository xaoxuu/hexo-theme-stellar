---
title: utils.js 延迟加载加固 执行计划
date: 2026-08-16
---

# 执行计划

## 实施步骤

1. [x] 新增 `layout/_partial/scripts/bootstrap.ejs`（队列 + DOMContentLoaded 补载）。
2. [x] `layout/_partial/scripts.ejs` 引入 bootstrap，并在 utils.js 标签后加解析期看门狗。
3. [x] `source/js/utils.js` 包 IIFE + 防重入 + `window.utils` + 队列补跑。
4. [x] `layout/_plugins/scrollreveal.ejs` 看门狗外移 + `stellar.initPlugin`。
5. [x] 其余 `utils.initPlugin` 调用点改为 `stellar.initPlugin`（swiper、adaptive_text、mermaid、copycode、pin_slider、services.js）。
6. [x] 知识库与 VERIFICATION.md 登记。
7. [x] 主工程 `npm run g` 全量构建 + 无头 Chrome 场景验证。

## 风险与回退

- `document.write` 仅在被改写时触发（同源、同步、少量字节），正常页面无副作用；若未来优化器连看门狗脚本也改写，DOMContentLoaded 补载与 `sr-fallback` 兜底仍生效。
- IIFE 包裹 utils.js 属机械变更，`window.utils` 兼容裸 `utils` 引用；回归以主工程构建 + 首页/文章页无头验证兜底。
