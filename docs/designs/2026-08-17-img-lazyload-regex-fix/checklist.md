# 验证清单

> 验证结果在对应命令通过后登记。

| 项目 | 命令 / 检查 | 结果 |
|------|-------------|------|
| 单测 | `node --test test/img_lazyload.test.js` | ✅ 16/16 通过 |
| 主题全量检查 | `npm run check` | ✅ 通过 |
| 主工程全量构建 | xaoxuu.com `npm run g`（clean + generate + gulp minify） | ✅ 通过；181 个 index 页 0 损坏 |
| 回归复现 | penndu/hexo 克隆 `hexo g` 产物 bootstrap 无 `data:image/png` 破坏；1599 页 0 损坏 | ✅ 通过 |
| 性能 | img_lazyload 1.5MB 输入 13ms（v1 版 O(n²) 曾单页 1.5s 拖垮构建） | ✅ 通过 |
| 无头浏览器 | 本地生成站点：0 异常、首卡 353ms 可见、`sr-fallback` 未触发 | ✅ 通过 |
| 页面类型覆盖 | 首页 / 文章页（archives/786）/ 标签页（tags/学习）均 0 异常 | ✅ 通过 |
