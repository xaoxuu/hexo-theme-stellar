# 执行计划

1. 建立基线：`hexo clean && hexo generate` 计时 + 快照 `public/`。
2. 用 `node --cpu-prof` 对 `hexo generate` 采样，按包归因生成阶段耗时。
3. 抽取 `scripts/lib/doc_tree.js` / `scripts/lib/notebooks.js` 纯函数，瘦身事件入口。
4. 为 `md_table` / `img_lazyload` / `img_onerror` 增加短路；`search.js` 正则编译外提；`related_posts.js` 删除死代码。
5. 新增/扩展单测（doc_tree 参照等价性、notebooks 分组、md_table 短路）。
6. 主题 `npm test` + `npm run lint` + `ci/check-require-decls.js`。
7. 受控微型站点：同版本构建确定性验证 + 旧/新主题副本字节级 diff。
8. 主工程 `npm run g` 全量验证并记录耗时。
9. 同步 `docs/knowledge/09-高级主题/performance.md` 与 `VERIFICATION.md`，最终 `npm run check`。
10. 改动保留在工作区，不自动提交（提交门禁见 `AGENTS.md` §5）。
