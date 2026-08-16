---
title: 移除 poster 配置执行计划
date: 2026-08-16
---

# 执行计划

## 实施步骤

1. [x] `_config.yml` 新增 `article.card_style: hero`（注释说明 hero / classic）
2. [x] `post_card.ejs` 删除 poster 读取，hero 判定 + 固定 bottom + title/subtitle>description
3. [x] `index.ejs` photo 类判定改为 `card_style == 'hero'` 且有 cover
4. [x] `pin_slider.ejs` 去掉 poster 回退（title + subtitle>description>excerpt）
5. [x] `list.styl` 移除 position=top 规则、caption 单行省略
6. [x] 新增 `subtitle()` helper（lib + helper + 单测），hero 卡片与置顶轮播共用取值逻辑
7. [x] 同步知识库（configuration / post-lists-cards / client-side-overview / 知识库全量）并登记 VERIFICATION.md
8. [x] 主仓库 `_config.stellar.yml` 启用 `card_style: hero`、清理旧 poster front-matter、`docs/specs/` 方案归档、`source/wiki/stellar/` 文档同步
9. [x] 验证：`npm run check`（lint + 单测 + 知识库核查）、`npm run g`、`rg poster` 残留检查（`npm run s` 视觉验收待用户预览）

## 风险与回退

- hero 卡片依赖封面图：无 cover 的文章自动回退 classic 卡片，不会出现无图文字浮层。
- `.text.topic` 与 `cover-overlay` 仍被专栏最新文章卡片使用，删除样式前已确认复用关系，不改动该组件。
- 若单行省略导致长标题小字被截断，可回退为多行限制（`-webkit-line-clamp`），默认采用 nowrap + ellipsis。
