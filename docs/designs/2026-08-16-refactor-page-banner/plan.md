# 执行计划

1. 重构 `layout/_partial/main/navbar/article_banner.ejs`：上块改为 `.top-row`（`.left#breadcrumb` + `.right`）+ `.meta-row`；`breadcrumb: false` 时不再输出空 `.top`。
2. 更新 `source/css/_components/partial/article-banner.styl`：`.top` 纵向两行布局 + 新增 `.top-row` / `.right` / `.meta-row` 规则。
3. 更新 `source/css/_components/partial/bread-nav.styl`：删除右对齐 hack，`.left` 合并面包屑 flex 布局。
4. 同步知识库：`docs/knowledge/03-内容系统/content-overview.md`、`docs/knowledge/VERIFICATION.md`。
5. 主工程同步：`source/wiki/stellar/advanced-settings.md`（刷新 `updated`）、`docs/specs/page-banner-refactor/`。
6. 验证：`npm run g`、页面矩阵 DOM 核对、`python3 docs/knowledge/tools/verify.py`，结果写入 `checklist.md`。

不自动提交；改动保留在工作区供审查，提交/推送仅在用户明确要求时执行。
