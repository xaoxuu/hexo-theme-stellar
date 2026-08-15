---
title: 图标异步加载优化 检查清单
date: 2026-08-15
---

# 检查清单 / 验证记录

## 验证

- [x] `npm run lint` 通过
- [x] `npm test` 通过（75 个用例，含新增 `icon()` 占位符/inline/URL 行为与 `stellar_icon_sets` 生成器用例）
- [x] 在主工程执行 `npm run g` 全量构建通过（182 页 + 16 个命名空间 JSON）
- [x] 页面类型覆盖：首页 / 文章页 / Wiki 页（express 内容页抽查 + jsdom 运行时替换验证）
- [x] 交互回归（构建期断言）：搜索 `p-id="1562"` 三态钩子内联（182/182 页）、菜单渐变 `menu-grad-*` 内联、leftbar `#sep` 动画钩子内联（182/182 页）、菜单 `solar:*` 无占位符、TOC rightbar 内联；chat 全站 0 处使用，weibo/timeline 走 `ctx.icons` 白名单不变
- [x] `python3 docs/knowledge/tools/verify.py` 知识库硬事实核查通过（未解析文件/配置键为既有非阻断报告）
- [x] 体积对比：全站真实内联 SVG 由 3,023,373 bytes（占 HTML 29.5%）降至 1,017,799 bytes（12.2%）；首页 HTML 由 90,911 bytes 降至 52,847 bytes（内联 SVG 约 47KB → 约 7KB）
- [x] jsdom 运行时验证：首页 29 个、express 页 34 个占位符全部被加载器替换为完整内联 SVG

## 文档同步

- [x] `docs/knowledge/09-高级主题/performance.md` 已更新
- [x] `docs/knowledge/04-标签插件/icon-tag.md` 已更新
- [x] `docs/knowledge/VERIFICATION.md` 已登记
- [x] `_data/icons.yml` 头部注释已更新
- [x] 主仓库 `source/wiki/stellar/tag-plugins/express.md` 已更新（正文修改，`updated` 已刷新）

## 待用户确认

- [ ] `npm run s` 本地预览最终视觉验收（首屏图标即时显示、非首屏图标异步补全无闪烁、搜索三态/菜单渐变/移动端按钮动画正常）
