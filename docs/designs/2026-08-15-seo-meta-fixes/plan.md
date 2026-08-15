# 执行计划

1. 新增 `scripts/lib/seo.js` 与 `scripts/helpers/seo.js`。
2. 更新 `scripts/helpers/json_ld.js`（图片/描述回退 + unshift bug）。
3. 更新 `layout/_partial/head.ejs`（wiki 标题去重、分页标题、og:site_name、og:image）。
4. 更新 `languages/*.yml` 新增 `symbol.page`。
5. 新增 `test/seo.test.js` 并运行单测。
6. 同步 `docs/knowledge/02-布局系统/head-seo.md` 与 `VERIFICATION.md`。
7. 主工程 `npm run g` 全量验证 + 抽查渲染；运行 `npm run check`。
