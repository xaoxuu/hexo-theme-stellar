# 检查清单 / 验证记录

## 基线与实测

| 项 | 结果 |
|----|------|
| 基线 `hexo generate` | ~3.15s（2026-08-15，120 篇 md / 8121 行） |
| 重构后 `hexo generate` | ~3.0s（user 2.84–2.90s，波动在噪声范围） |
| `gulp minify`（未改动） | html 5.2s / js 3.9s / css 1.7s（并行 ~5.5s） |
| generate CPU profile | themes/stellar ~9%（本次优化对象）；autonofollow ~19%、stylus ~18%、core ~24% 记录为后续可选方向 |

## 单测与静态检查

- [x] `npm test`：91/91 通过（新增 doc_tree 参照等价性 + notebooks 分组 + md_table 短路用例）
- [x] `npm run lint`：通过
- [x] `node ci/check-require-decls.js`：无幽灵依赖

## 输出等价性

- [x] 受控微型站点（/tmp/hexo-verify/site，60 个产物文件）：同版本两次构建 `diff -rq` 为空（确定性）
- [x] 旧主题副本 vs 新主题副本：`diff -rq` 为空，**逐字节一致**
- [x] 主工程 `hexo clean && hexo generate` 构建成功；与基线 diff 的差异仅为既有的 run-to-run 模型顺序波动（并发扫描导致，与本次改动无关，已用同代码双跑复现 66/182 处同类差异）

## 页面类型覆盖（受控站点 + 主工程抽查）

- [x] Wiki 页（doc_tree：tree/sections/首页/未收录页/related）
- [x] 文章页（带表格 → md_table 包裹；不带表格 → 短路；带图片 → 懒加载/onerror 过滤）
- [x] 普通页面（about）
- [x] search.json / sitemap / CSS / JS 资产

## 文档同步

- [x] `docs/knowledge/09-高级主题/performance.md` 补「构建期性能」
- [x] `docs/knowledge/VERIFICATION.md` 登记
- [x] `npm run check`（含 `verify.py` 硬事实核查）最终通过

## 提交

- [ ] 不自动提交，改动保留在工作区供审查（与 `AGENTS.md` §5 一致；主仓库仅按需更新子模块指针）
