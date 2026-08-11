---
title: 压缩页面顶部与侧边栏间距 检查清单
date: 2026-08-12
---

# 检查清单 / 验证记录

## 验证

- [x] `npm run lint` 通过
- [x] `npm test` 通过（9/9，本次无纯函数改动）
- [x] 主工程 `npm run g` 全量构建通过（hexo generate + gulp minify，204 文件）
- [ ] 页面类型覆盖：首页 / 文章页 / Wiki 页 / 移动端视口（本会话无浏览器工具，待用户预览确认）
- [x] `python3 docs/knowledge/tools/verify.py` 知识库硬事实核查通过（行号异常 0、版本不一致 0）
- [ ] 浏览器兼容性检查（`8pt` 为 CSS 标准单位，现代浏览器均支持）

## 文档同步

- [x] `docs/knowledge/02-布局系统/sidebar-system.md` 已更新
- [x] `docs/knowledge/VERIFICATION.md` 已登记变更
- [ ] `languages/` 文案（本次不涉及）
