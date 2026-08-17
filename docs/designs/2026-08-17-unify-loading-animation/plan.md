---
title: 统一 loading 动画执行计划
date: 2026-08-17
---

# 执行计划

## 实施步骤

1. [x] `_data/icons.yml`：删除旧 `default:loading` 与 `default:loading-spinner`，`default:loading-placeholder` 改名 `default:loading` 并更新注释。
2. [x] `_config.yml`：`default.loading` 兼容回退注释改为引用 `default:loading`。
3. [x] 引用改键：`scripts/tags/lib/`（image/gallery/albums/posters/friends/sites）、`layout/_partial/scripts/defines.ejs`、`scripts/generators/stellar-icons.js`。
4. [x] 评论区占位：6 个评论 `layout.ejs` 改用 `.lazy-icon` div；`related.styl` / `utterances.styl` 定位规则改为 `.cmt-body .lazy-icon`。
5. [x] 异步占位：`source/js/utils.js` `onLoading` 改插 `.lazy-icon`；`lazyload.styl` 提取基础规则；`loading.styl` 补充 `.loading-wrap .lazy-icon`。
6. [x] 知识库同步：`icon-tag.md`、`configuration.md`、`VERIFICATION.md`。
7. [x] 验证：lint + 128 单测通过（含 icons 键完整性）；主工程 `npm run g` 通过并检查产物；`verify.py` 仅余预存版本号偏差（installation.md 1.42.0 vs 1.42.1，与本次改动无关）。

## 风险与回退

- 风险：`.lazy-icon` 在评论区无相邻 `img`，需独立定位规则，避免遮挡已渲染评论（保持与旧 `svg.loading` 相同的层级行为）。
- 回退：git 检出 `themes/stellar` 工作区改动即可恢复；若站点级覆盖了 `default:loading-placeholder`，需同步改名 `default:loading`（当前主工程无覆盖）。
