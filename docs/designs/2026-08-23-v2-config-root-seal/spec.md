---
title: Stellar v2 配置根封闭与内部运行时边界
date: 2026-08-23
status: 已完成
issue: 712
---

# 配置根封闭方案

## 1. 问题与目标

#702–#711 已将全部公开主题字段迁入 `site/seo/layout/content/appearance/resources/extensions/inject` 八根契约，但根 Schema 仍为开放对象，`stellar/system` 仍出现在主题 YAML，主题数据和派生对象仍写入 `theme.config`。这会让未知根字段、包元数据、Hexo 字段与内部运行时状态继续混在同一命名空间。

本切片是 Pre-alpha M1.5 最后一个纵向切片：封闭公开配置根，将 package / Hexo / 主题数据 / 派生运行时对象移出公开配置边界，不改变当前生成结果。

## 2. 公开输入边界

- 站点 `_config.stellar.yml` 只允许 `site`、`seo`、`layout`、`content`、`appearance`、`resources`、`extensions`、`inject`。
- 主题 `_config.yml` 只镜像七个可提供默认的根域；`inject` 仅属于站点和 Front Matter，不在主题默认 YAML 中出现。
- `CONFIG_SCHEMA.sealed` 设为 `true`；未知根、旧根、已移除根和非对象根输入在构建早期产生结构化诊断。
- 不提供别名、双读、自动改写、类型强转或静默 fallback。

## 3. 排除与内部化边界

### Package 元数据与核心资源

- 删除 `_config.yml.stellar`。
- 主题名、版本、主页与仓库来自 `package.json`。
- 主 CSS / JS 路径由冻结的内部 asset manifest 提供，EJS 不再读取 `theme.stellar`。
- 发版脚本只更新 `package.json` 与知识库版本文本，不再维护重复的 YAML 版本。

### Hexo 集成

- 删除 `_config.yml.system`；pretty URL 政策作为 v2 内部 Hexo 集成规则无条件应用。
- 遗留 `cache/language_switcher` 不进入 v2 契约，根封闭后直接拒绝。
- Hexo `_config.yml`、Hexo Front Matter 与 `hexo.config` 保持外部所有权，只作为声明式默认派生或模型输入，不被并入 `hexo.stellar.config`。

### 主题数据与派生对象

- `icons/widgets/authors/defaultAuthor/links/chatUsers/wiki/topic/notebooks` 收敛到 `hexo.stellar.data`。
- 生成事件、generator、helper 和 tag plugin 直接消费 `hexo.stellar.data`。
- EJS 通过内部 `stellar_data(path)` helper 读取，不再把派生数据伪装成 `theme.config` 字段。
- `hexo.stellar.config` 只保留八根声明式配置，并保持深度冻结。

## 4. 复用与实现接缝

- 复用 `CONFIG_SCHEMA`、`parseStellarConfig()`、`ConfigSchemaError` 和现有 Reference 生成器。
- 复用 `stellar_config()` 的路径读取模式实现 `stellar_data()`。
- 复用 `schema-utils.deepFreeze()` 冻结 package / asset manifest；派生数据由构建阶段按顺序组装，不作为配置 Reference。
- 不新增依赖，不引入第二套 Schema 或兼容层。

## 5. 影响范围

- 主题：`_config.yml`、配置 Schema / inventory / target、配置事件、数据构建器、helper / generator / tag / EJS 消费方、发版脚本、Reference 和测试。
- 知识库：配置系统、总览、安装/发版与 `VERIFICATION.md`。
- 主工程：只同步 `docs/specs/stellar-v2-{config-root-seal,blueprint}/`，保持未提交，不更新子模块指针。

## 6. 验收

- 八根及非对象根的成功/失败契约有单测。
- 主题 YAML 不含 `stellar/system`；主题数据与派生对象不再读写 `theme.config` 动态键。
- 当前主工程可用八根配置完整构建，页面输出、URL、SEO、样式与客户端行为不变。
- 主题 `npm run check`、主工程 `npm run g` 和 Standards / Spec 双轨 review 通过。
- 完成后 M1.5 标记为已交付；M2 与 Alpha 1 仍保持未完成。

## 7. N/A

- 公开 Wiki、迁移页、SEO 输出、视觉验收和浏览器交互改动为 N/A；本切片只改变配置错误边界和内部存储位置。
