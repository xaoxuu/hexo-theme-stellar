---
title: Stellar v2 Blueprint 与 CLI 分发入口
date: 2026-08-23
status: 已完成
---

# 目标

完成 Pre-alpha M3 的分发入口：让用户在现有 Hexo 8 / Node.js 22 工程中选择 Classic Blog、Minimal Reading 或 Docs Reference，并用 `stellar` / `minimal` Visual Style 一次性生成显式配置、数据与 starter 内容；同时提供只读 `stellar doctor`，用 M1.5 的最终 Schema 检查环境和 v2 配置。

# 用户结果

- `npx hexo stellar init --blueprint <id> --style <id>` 在写入前展示完整计划，拒绝覆盖已有文件。
- `--dry-run` 与真实写入消费同一份深冻结计划；`--non-interactive` 不读取终端输入。
- 生成文件归用户所有，不包含 Blueprint ID、锁文件或运行时继承关系。
- `npx hexo stellar doctor --format text` 或 `npx hexo stellar doctor --format json --silent` 只读检查 Node.js、Hexo、主题入口、`_config.stellar.yml`、Collection YAML 与 Markdown Front Matter；JSON 模式使用 Hexo 全局 `--silent` 屏蔽命令加载前的框架日志，保证 stdout 可直接解析。
- doctor 的每个问题都包含来源文件、字段路径、实际类型、期望结构和迁移章节。

# 契约与实现

## 复用入口与新增定义

- 复用 `parseStellarConfig()`、`parseCollectionConfig()`、`parsePageConfig()` 作为生成资产与 doctor 的字段事实来源；复用 Hexo `console.register` 作为命令入口，复用 npm 主题包的 `scripts/` 自动装载与现有知识库/Reference 生成门禁。M3 不涉及设计令牌、mixin、partial、helper、`utils.js`、客户端服务或生命周期。
- `BLUEPRINT_IDS`：三套内置站点蓝图的封闭 ID；作用域为 manifest Schema、init 选择与 Blueprint Reference；默认项取数组首项 `classic-blog`；不进入公开主题配置。
- `VISUAL_STYLE_IDS`：两套内置视觉风格的封闭 ID；作用域为 manifest Schema、init 选择与 Blueprint Reference；默认值由各 Blueprint 的 `default_style` 提供；不进入公开主题配置。
- `STYLE_SLOT`：`_config.stellar.yml` 模板唯一视觉片段插槽；只在 Blueprint 模板渲染期消费，值来自所选 Style 的已校验 `appearance` 片段；生成后必须消失，不成为配置字段。
- `DATE_SLOT`：starter Markdown 的生成日期插槽；只在 Blueprint 模板渲染期消费，默认值来自 init 执行时间并格式化为站点内容时间；生成后必须消失，不成为 Front Matter 字段名或运行时入口。
- `parseFrontMatterYaml()`：Blueprint 生成校验与 doctor 共用的 BOM/CRLF 兼容 Front Matter YAML 入口；只解析并返回普通对象，由调用方分别映射 Blueprint 错误和 doctor 结构化问题，不修改源文件。

## Blueprint / Visual Style

- `blueprints/<id>/manifest.json` 声明 Blueprint 身份、说明、默认 Style 与安全的源文件→目标文件映射。
- `blueprints/styles/<id>/manifest.json` 声明 Style 身份和一个 `appearance` YAML 片段。
- `_config.stellar.yml` 模板通过唯一 `{{visual_style}}` 插槽接收完整 Style 片段；生成后只留下八根 v2 配置，不保留模板标记。
- 首发 ID 固定为 `classic-blog`、`minimal-reading`、`docs-reference` 和 `stellar`、`minimal`。

## 文件计划

- `scripts/schema/blueprint-schema.js` 是 manifest 的声明式事实来源，封闭字段并拒绝重复目标、未知字段、非法 ID/枚举和不安全相对路径；目录加载边界再校验固定目录与 manifest ID 一致，并阻断物理符号链接逃逸。
- `scripts/lib/blueprints/` 只接收普通路径和选项，返回深冻结普通对象；所有目标必须位于站点根内，所有模板必须位于主题 `blueprints/` 内。
- 真实写入必须先完成全计划冲突检查；任何已有目标都会让整次 init 失败，不写入部分结果。

## CLI

- `scripts/commands/stellar.js` 只负责参数、交互和文本/JSON 输出；计划、写入、诊断和格式化在可单测的 library 中完成。
- 无参数且连接 TTY 时提供编号选择与最终确认；非 TTY 时使用 `--non-interactive` 或明确参数，不隐式等待输入。
- doctor 复用 `parseStellarConfig()`、`parseCollectionConfig()` 与 `parsePageConfig()`，不建立第二套字段表，不自动修复文件。

# Blueprint 输出

- Classic Blog：博客菜单、博客布局配置和一篇 starter Post。
- Minimal Reading：以阅读为中心的简化菜单、较低动效/密度和一篇 starter Post。
- Docs Reference：Wiki 菜单、Wiki Collection 数据、项目首页与 Getting Started 页面。
- 三套默认组合分别为 Classic Blog + stellar、Minimal Reading + minimal、Docs Reference + stellar；每套 Blueprint 都允许显式选择两种 Style。

# 影响范围

- 主题：新增 `blueprints/`、Blueprint/doctor Schema 与 library、`stellar` 命令、测试、知识库和验证登记；`package.json` 增加 CLI 直接使用的 `js-yaml` 依赖。
- 主仓库：只同步 `docs/specs/stellar-v2-blueprint/{spec,plan,checklist}.md` 状态，保持未提交；不改 `source/`，不更新 v2 子模块指针。
- 公共 YAML/Front Matter：只生成已经交付的 v2 字段，不新增字段。
- URL、CSS、语言文案、浏览器 API、迁移跳转与公开 Wiki：N/A；M5/Beta 才接入公开 Reference、学习路径与迁移/SEO 路由。

# 验收

- 三套 Blueprint、两套 Style 的 manifest 与渲染配置通过严格 Schema。
- dry-run/真实写入计划一致，冲突、路径穿越、未知 ID 和非交互参数错误均被拒绝。
- doctor text/json 覆盖通过和失败结果，并保留完整来源化问题。
- 三套默认 Blueprint 在临时干净 Hexo 8 / Node.js 22 工程中分别初始化、doctor 通过并独立执行 `hexo generate`。
- `npm run reference:check`、主题 `npm run check`、知识库核查和主工程 `npm run g` 通过；Standards / Spec 双轨 review 无剩余 finding。
- 门禁通过后闭环绑定的主题 v2 issue；M3 完成，M4–M5 与 Alpha 1 保持未完成。
