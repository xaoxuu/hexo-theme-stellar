---
title: Stellar v2 site Shell 配置纵向迁移
date: 2026-08-22
status: 已实施
issue: 706
---

# site Shell 配置方案

## 1. 目标

把 #704 冻结的 `site.brand/menu/footer` 作为第二个最终 v2 配置纵向切片交付。Brand、主菜单、左栏操作和页尾分栏只消费冻结的 `hexo.stellar.config.site`，不再读取 `theme.brand/menubar/footer`。

## 2. 复用能力

- 复用 #705 的唯一声明式 Schema、结构化诊断、冻结运行时、`stellar_config()` 与配置 Reference。
- 复用 #704 `config-target.js` 的最终路径、类型、默认值、边界、运行时键和迁移矩阵。
- 复用既有 Brand 合并函数、Navigation 原语、Dropdown partial、Markdown Footer 渲染和当前 DOM/CSS。

## 3. 配置契约

- `brand` → `site.brand`，`brand.image.style` → `site.brand.image.variant`。
- `menubar.items` → `site.menu.items`，菜单项 `theme` → `accent`。
- `footer.social/sitemap/content` → `site.footer.actions/sections/content`；动态 action ID 的父级记录开放，每个 action 和 dropdown item 内部封闭。
- `site.brand.image.src/name/tagline` 的派生默认分别来自 Hexo `avatar/title/subtitle`；字面默认仍只在 Schema 目标契约定义。
- 数组由站点层完整替换；封闭对象按声明字段合并；动态 action 记录按 key 接受，不做类型转换。
- YAML 使用 snake_case，规范化后 JavaScript 使用 `variant/accent/actions/sections`。

## 4. 消费链

- Brand helper 从 `hexo.stellar.config.site.brand` 开始级联当前 Collection / Front Matter 覆盖；未迁移的内容作用域输入在建模边界收敛为 `variant` ViewModel。
- Post 与 Topic 建模不再从原始 `themeConfig.brand` 推断全局 Brand。
- 菜单 partial 只从 `site.menu.items` 构建 Navigation entries，强调色消费 `accent`。
- 左栏 Footer 只从 `site.footer.actions` 渲染普通操作、spacer 与 dropdown；主 Footer 只从 `sections/content` 渲染。

## 5. 边界

- `layout/content/appearance/resources.fallbacks/extensions` 仍为 `planned`，配置根仍不封闭。
- Collection / Front Matter 的最终字段改名与严格 Schema 留在第三迁移切片；本次不接受旧主题根别名。
- 不修改 CSS、国际化、公开 Wiki、URL、SEO 输出或浏览器协议，不新增依赖。
- 主工程配置与总蓝图只保留未提交更新，不提交子模块指针。

## 6. 影响范围

- Schema 与 Reference：`scripts/schema/config-{target,schema,inventory}.js`、`scripts/lib/config-{schema,reference-metadata}.js`、`scripts/events/lib/config-schema.js`、`reference/v2-{config,models}.json`。
- 运行时与 ViewModel：`scripts/lib/{brand,models/index}.js`、`scripts/helpers/brand.js`、`scripts/events/lib/{config,content-config}.js`。
- Shell 模板与默认配置：`_config.yml`、`layout/_partial/sidebar/{brand,menu,index_leftbar}.ejs`、`layout/_partial/main/footer.ejs`。
- 契约测试：`test/config-{schema,target,inventory}.test.js`、Brand/ViewModel/Reference 测试与 `test/site-shell-config-consumption.test.js`。
- 内部知识库：`docs/knowledge/00-总览与安装配置/configuration.md`、`02-布局系统/{logo-navigation-headers,sidebar-system}.md`、`03-内容系统/content-schema-v2.md`、`VERIFICATION.md`。
- 主工程未提交验证：`_config.stellar.yml`、`docs/specs/stellar-v2-{site-shell-config,blueprint}/`；不修改 `source/wiki/stellar/` 公开 Wiki。

## 7. 验收

- Schema 对派生默认、封闭对象数组、动态记录、数组替换、深度冻结和严格诊断有自动化测试。
- 配置 Reference 只增加本次真实交付的 `site` 节点，目标契约与运行时 Schema 无漂移。
- 源码搜索确认当前 Shell 消费方不再读取 `theme.brand/menubar/footer`。
- 主题 `npm run check`、知识库核查、主工程 `npm run g` 与首页/文章/Wiki 产物抽查通过。
- Standards / Spec 双轨 review 无剩余 finding 后提交并推送 `v2`，闭环 #706。
