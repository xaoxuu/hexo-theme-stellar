---
title: default 命名空间图标统一替换为 Solar 执行计划
date: 2026-08-15
---

# 执行计划

## 实施步骤

1. [x] 从 Iconify Solar 集合拉取 20 个目标图标当前版 SVG body。
2. [x] 重写 `_data/icons.yml`：15 个 `default:*` 键改名 + 换值，保留 `default:search` / `default:rss` / `default:leftbar` / `default:rightbar` / `default:loading-spinner` / `default:loading-placeholder`，更新分区注释与覆盖机制说明。
3. [x] 同步引用点：`layout/`（comments/toc/menubtn/sidebar/widgets/post_card/note_card/categories/contributors/defines.ejs）、`scripts/tags/lib/`（about/banner/copy/hashtag/image）、`source/js/services/`（weibo/timeline）、`_config.yml`。
4. [x] 同步知识库（icon-tag.md / post-lists-cards.md / configuration.md / 知识库全量.md）、`VERIFICATION.md` 登记、新建本方案目录。
5. [x] 验证：`python3 docs/knowledge/tools/verify.py`、主题仓库 `npm run check`、主工程 `npm run g`。
6. [x] 还原 `default:search`（三态着色依赖 `p-id="1562"`）与 `default:rss`（经典 RSS 视觉）为原键原值，同步引用与文档，复查通过。
7. [x] 尝试 `default:search` 换为 `solar:minimalistic-magnifier-line-duotone` 并改用 `circle` 三态选择器，因线条过细最终还原为原 `default:search` 图标（`path[p-id="1562"]` 选择器），文档同步，复查通过。
8. [x] 移动端悬浮按钮尝试 Solar outline 后因丢失 `path#sep` 位移动画，还原 `default:leftbar` / `default:rightbar` 为原键原值，复查通过。

## 风险与回退

- 键重命名破坏站点级覆盖：已确认主工程无旧键覆盖；若站点使用旧键，需同步改名（icons.yml 头部已注明）。
- `default:warning` 动画丢失、`default:loading` 依赖 CSS spin：视觉可接受，若需恢复描边动画可回退保留原值；`default:search` 尝试 Solar line-duotone 后因线条过细，还原保留原图标。
- 替换遗漏：`test/icons.test.js` 的键完整性单测兜底，缺失引用会导致 `npm test` 失败。
