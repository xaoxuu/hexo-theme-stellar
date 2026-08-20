---
title: Dropdown 与侧栏列表样式统一检查清单
date: 2026-08-20
---

# 检查清单 / 验证记录

## 验证

- [x] dropdown 定向单测通过
- [x] `npm run lint` 通过
- [x] `npm test` 通过（135 项）
- [x] `python3 docs/knowledge/tools/verify.py` 通过（无阻断项）
- [ ] `npm run check` 完整通过：最后的 `check-release-docs` 被 1.42.1 后已有 11 个未登记历史提交阻断，与本次工作区改动无关
- [x] 主工程 `npm run g` 全量构建通过（252 个文件）
- [x] 生成 HTML 覆盖 Footer 与正文 dropdown，并确认 collection 结构、文字后置箭头及合并后的 open/hover CSS
- [x] 浏览器盒模型回归：Footer 普通按钮与 dropdown trigger 均为 32×32px，SVG 均为 24×24px，computed flex 均为 `0 1 auto`
- [x] 正文 dropdown 保持通用尺寸：箭头 20×20px、`flex: 0 0 20px`，DOM 顺序仍为文字后接箭头
- [x] 编译 CSS 中图片型 Social 图标保持 `flex: initial; width: auto; height: auto`
- [x] 浏览器状态回归：Footer dropdown 关闭时主图标 opacity 为 `0.5`，打开后为 `1`；普通 social 默认仍为 `1`
- [x] 浏览器混合条目回归：Footer 与正文 dropdown 菜单项桌面均为 32px、移动端约 35px；有/无图标项的 padding、gap、圆角和字号一致，无图标项不输出 leading
- [x] 浏览器宽度回归：Footer 与正文 dropdown 在 1280px 桌面和 390px 移动视口的 computed `min-width` 均为 150px，宽度声明保持 `auto`，长内容可在视口上限内自然扩宽
- [x] 编译 CSS 不再包含 dropdown 文字阴影，菜单玻璃背景及条目 hover/active 背景保持不变
- [x] 浏览器明暗主题回归：菜单计算样式均为 `text-shadow: none`，玻璃表面与条目交互反馈正常
- [ ] glass 浅色/深色视觉由用户预览验收

## 文档同步

- [x] `docs/knowledge/` 对应领域已更新
- [x] `docs/knowledge/VERIFICATION.md` 已登记
- [x] 主工程 Stellar Wiki 已更新并刷新 `updated`
- [x] 无新增语言文案
