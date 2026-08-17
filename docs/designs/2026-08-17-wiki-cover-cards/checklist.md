---
title: Wiki 封面卡片布局改造检查清单
date: 2026-08-17
---

# 检查清单 / 验证记录

## 验证

- [x] 网格列定义为 WebKit 兼容的 `repeat(auto-fit, minmax(240px, 1fr))`，避免不支持嵌套 `min()` 时回退为隐式单列，并让卡片列均分铺满容器
- [x] Wiki 卡片信息层仅用 `left/right/bottom: 0` 按内容高度贴底，取消通用 padding；上方文案区和全宽项目底栏分别设内边距，项目底栏使用 `rgba(black, .1)` 轻微遮罩。主题色蒙版从卡片 50% 开始渐显、底部 100% 达到满不透明，hover 显示同源但明度提高 20 个点、跟随全局连续曲率的 2px 边框；标签/平台无背景或边框，项目区无顶部边框
- [x] 营销标题固定为 `1.25rem`、`font-weight: 700`，窄屏不再降级字号
- [x] 标签移除 `cap` / `breadcrumb` 旧类及分类色，复用 `.wiki-meta` 的排版和主题文字色
- [x] Wiki 元信息文字统一样式，间距为 `.5rem 1rem`；项目图标为 30% 圆角、`var(--block)` 背景
- [x] 项目未配置 `icon` 时使用内置 Solar `default:documents`，并以 `var(--text-p2)` 着色
- [x] 显式 `subtitle` 含 ` | ` 且左侧非空时，Wiki 项目底栏与通用小字只显示左侧文本
- [x] `available` 字符串与热度分别使用内置 Solar 风格的 `default:platforms` 多设备图标和 `default:fire` 火焰图标；热度数值仍取 GitHub star，隐藏逻辑不变
- [x] 无封面卡片 hover 使用 `--block-border`；封面模糊层和主题色蒙版仅在图片加载成功后显示，加载失败降级为空封面
- [x] 覆盖层额外等待 `adaptive-text` 平均主题色结果；成功写入主题色、失败确认 CSS 回退后才与已加载封面一并淡入，避免默认主题色闪现
- [x] `npm run lint` 与 `npm test`（128 项）通过；`npm run check` 在既有知识库版本不一致处失败（`installation.md` 1.42.0，主题 1.42.1）
- [x] 主工程 `npm run g` 通过
- [x] Wiki 总列表与标签筛选列表完成构建渲染
- [x] cover、icon、available、repo 的回退已由渲染输出确认
- [x] GitHub star 成功、失败、无仓库状态由模板与 `ghinfo` 分支覆盖
- [x] 营销标题按 `headline → title → name` 回退（模板静态检查；站点数据未补写 `headline`）
- [ ] 窄屏和 hover 浏览器检查

## 文档同步

- [x] `docs/knowledge/` 已更新
- [x] `VERIFICATION.md` 已登记
- [x] 主工程 Stellar Wiki 已更新
