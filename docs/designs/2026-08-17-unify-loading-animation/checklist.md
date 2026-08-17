---
title: 统一 loading 动画检查清单
date: 2026-08-17
---

# 检查清单 / 验证记录

## 验证

- [x] `npm run check`：lint 通过、128 单测通过（含 icons 键完整性）、依赖声明与 AI 规范引用检查通过
- [~] `python3 docs/knowledge/tools/verify.py`：仅余预存版本号偏差（installation.md 1.42.0 vs 1.42.1，非本次改动引入）
- [x] 在主工程执行 `npm run g` 全量构建通过（hexo generate + gulp minify）
- [x] 页面类型覆盖：首页 / 文章页（artalk 评论区占位产物验证 `.lazy-icon` 三圆点）/ Wiki 页构建通过
- [x] 产物检查：`js/stellar-icons.js` 无 `default:loading-spinner`；`main.css` 含 `.lazy-icon` 基础规则、`.cmt-body .lazy-icon` 定位（top 60px/62px、居中、z-index -1 保持层级）、`.loading-wrap .lazy-icon` 尺寸与 inline-block；`utils.js` onLoading 插入 `.lazy-icon` + `def.loading`；`display:none` 仅限定 `img.lazy.error/loaded + .lazy-icon`
- [ ] 浏览器手工验证：评论区三圆点占位不遮挡评论；最新评论、timeline、友链 `.loading-wrap` 三圆点；图片懒加载无回归；`{% icon default:loading %}` 输出 URL 图标（需本地 `npm run s` 目验）

## 文档同步

- [x] `docs/knowledge/04-标签插件/icon-tag.md` 已更新
- [x] `docs/knowledge/00-总览与安装配置/configuration.md` 已更新
- [x] `docs/knowledge/VERIFICATION.md` 已登记
