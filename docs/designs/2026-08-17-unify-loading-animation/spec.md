---
title: 统一 loading 动画（评论区与异步数据服务复用图片三圆点，键改名 default:loading）
date: 2026-08-17
status: 已通过
---

# 统一 loading 动画 方案

## 1. 问题与目标

- 主题内存在三套加载动画：评论区占位用 `icon('default:loading')`（`svg.loading` 旋转图标）；异步数据服务用 `.loading-wrap` + `default:loading-spinner`（环形）；图片懒加载用 `.lazy-icon` + `default:loading-placeholder`（eos-icons 三圆点）。视觉不统一。
- 成功标准：评论区占位与全部异步加载占位（`.loading-wrap`）统一为图片同款三圆点动画；图标键删除旧 `default:loading`（Solar 旋转图标），`default:loading-placeholder` 改名为 `default:loading`；删除不再被引用的 `default:loading-spinner`。

## 2. 技术方案

- 图标键：`_data/icons.yml` 删除旧 `default:loading` 与 `default:loading-spinner`，`default:loading-placeholder` 改名 `default:loading`（值不变）；`_config.yml` 兼容回退注释同步；`scripts/generators/stellar-icons.js` 客户端白名单移除 `default:loading-spinner`。
- 引用改键：6 个标签插件（`image`/`gallery`/`albums`/`posters`/`friends`/`sites`）与 `layout/_partial/scripts/defines.ejs` 中的 `default:loading-placeholder` 引用改为 `default:loading`，保留 `theme.default.loading || …` 兼容回退。
- 评论区占位：6 个评论 layout 用 `.lazy-icon` div 替换 `icon('default:loading')`，背景图取 `theme.default.loading || theme.icons['default:loading']`；`related.styl` / `utterances.styl` 的 `.cmt-body svg.loading` 定位改为 `.cmt-body .lazy-icon`。
- 异步加载占位：`source/js/utils.js` 的 `onLoading` 在 `.loading-wrap` 内插入 `.lazy-icon` div（背景图取全局 `def.loading`）；`lazyload.styl` 提取 `.lazy-icon` 独立基础规则，`loading.styl` 补充 `.loading-wrap .lazy-icon` 尺寸与间距。
- 涉及模块：`_data/`、`layout/_partial/comments/*/layout.ejs`、`layout/_partial/scripts/defines.ejs`、`scripts/tags/lib/`、`scripts/generators/`、`source/js/utils.js`、`source/css/_plugins/lazyload.styl`、`source/css/_common/loading.styl`、`source/css/_components/partial/related.styl`、`source/css/comments/utterances.styl`、`docs/`。

## 3. 影响范围

- 对外行为：评论区加载占位、异步数据服务加载占位（最新评论、timeline、友链等）视觉统一为三圆点；`default:loading-placeholder` 键名变更（内部键，站点级覆盖需同步改名）。
- 兼容性：`default.loading` 配置兼容回退保留；通用 `svg.loading` 旋转规则保留（`{% icon %}` 自定义图标特殊类）。
- 需要同步的知识库：`docs/knowledge/04-标签插件/icon-tag.md`、`docs/knowledge/00-总览与安装配置/configuration.md`、`docs/knowledge/VERIFICATION.md`。

## 4. 验证方式

- `npm run check`（lint + 单测 + 依赖声明 + 知识库硬事实核查，含 icons 键完整性）。
- `python3 docs/knowledge/tools/verify.py` 知识库硬事实核查。
- 主工程 `npm run g` 全量构建；检查首页、文章页、Wiki 页 HTML 与样式产物。
- 手工验证：评论区 6 种服务占位、最新评论/时间线/友链等 `.loading-wrap` 场景、图片懒加载、`{% icon default:loading %}`。
