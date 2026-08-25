---
title: Stellar v2 Theme Schema 单源与 Brand 配置边界
date: 2026-08-25
status: 已完成
---

# Theme Schema 单源与 Brand 配置边界方案

## 1. 问题与目标

Theme 字段的类型、默认值和说明分散在目标契约、运行时 Schema 与 `_config.yml`。同时，Brand 三个字段在主题配置缺失时隐式读取 Hexo `avatar/title/subtitle`。本切片把 Theme 结构和默认值收敛到 `CONFIG_SCHEMA`，由同一 Schema 生成默认 YAML，并删除 Brand 的 Hexo fallback。

## 2. 技术方案

- Theme Schema 直接拥有字段类型、字面量默认值、级联、约束、说明和示例；目标契约只保留迁移与内容域阶段信息。
- 默认配置生成器按固定根域顺序遍历 Schema，输出稳定、可校验的 `_config.yml`；Reference、字段审计和 doctor 继续消费同一 Schema。
- 默认配置中的每个活动叶子必须具有语义描述，缺少描述时 Schema 构造直接失败；生成器从类型、枚举、范围和数组元素 Schema 追加约束提示。结构节点只在承担分组语义时显示注释，YAML 示例必须显式登记，禁止以字段路径复述用途或跨 Profile 复用误导示例。
- `site.brand.image.src/name/tagline.text` 使用字面量 `null`；主题解析不接收 Hexo site config。显式 `{config.*}` 模板替换、Collection 自动 Brand 与页面/Collection 覆盖不变。
- 提供 `schema:generate` / `schema:check`，统一默认 YAML、Reference 与审计产物生成，并移除 Contribution 门禁中的重复 Reference 检查。

## 3. 影响范围

- 主题 `scripts/schema/`、配置解析、生成脚本、`package.json`、默认配置、测试和配置/Brand 知识库。
- 主站显式配置 Brand；公开 Wiki 删除 Hexo fallback 说明。
- 空配置普通页面不再输出全局 Brand Header，这是预期的 v2 行为变化；其它页面、SEO、样式与运行时能力不变。

## 4. 验证方式

- 单测覆盖空配置、显式 Brand、构建事件隔离、Collection 自动 Brand、生成确定性与产物漂移。
- 运行 `npm run check`、`npm run integration:check`、知识库核查及主工程 `npm run g`。

## 5. 验证结果

- Node.js 22 下 `npm run check` 通过：423 项测试、Schema 产物漂移、首屏性能、知识库和发布文档门禁全部通过。
- `npm run integration:check` 的 classic-blog、minimal-reading、docs-reference 与 default-content tarball fixture 全部通过；注释修正后的最终轮次在一次 npm `ECONNRESET` 后重试成功。
- 主工程 `npm run g` 生成并压缩 262 个文件；首页仍包含显式头像、wordmark、`XAOXUU` 和现有标语。
- M10 与 Alpha 1 状态未变；未提交、未推送、未更新主仓库子模块指针。
- 注释质量修正后，生成配置不再包含 `<字段路径> 配置。`；活动叶子全部具有语义注释，类型/枚举/范围由 Schema 自动展示，示例仅在显式登记时输出。
