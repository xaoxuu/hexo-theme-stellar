# 检查清单 / 验证记录

- [x] `node --test test/seo.test.js` 通过（7 个用例）。
- [x] 主工程 `npm run g` 构建通过。
- [x] 抽查：wiki 页 title 去重（7 个受影响项目）、文章页 og:site_name、JSON-LD image/description、分页页 title（`XAOXUU - 第 2 页`）。
- [x] `npm run check`（lint + 单测 + 依赖声明 + 知识库核查）通过。
- [x] 全站 JSON-LD 复检：`"image":[]` 0 篇、`"description":""` 0 篇、无数字 image bug。
