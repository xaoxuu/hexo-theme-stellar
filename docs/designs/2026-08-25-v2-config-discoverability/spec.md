---
title: Stellar v2 主题配置可发现性
date: 2026-08-25
status: 已实施
---

# 主题配置可发现性方案

## 1. 问题与目标

Stellar v2 已用声明式 Schema 封闭主题公开配置，但默认 `_config.yml` 仍省略了六个 Brand 字段，部分数组与动态映射也只有概念说明、没有可直接复制的 YAML 结构。用户仅阅读主题配置文件时无法完整发现公开能力。

本方案要求每个主题级公开字段都能在 `_config.yml` 中找到：字段名始终使用活动 YAML，未设置的值保持为空并在行尾注释示例值；对象数组和动态映射提供完整示例或明确键值契约。

## 2. 技术方案

- 在 `_config.yml` 中补齐 `site.brand.image.src/image.href/name/wordmark/tagline.text/tagline.hover` 活动字段；后续由 `2026-08-25-v2-theme-schema-single-source` 改为从 Schema 生成，并取消 Hexo `avatar/title/subtitle` 派生。
- 补充 Footer dropdown/spacer、Notebook tag icon 与 contributors repository 的可复制示例；第三方参数袋继续明确为上游透传，不穷举外部 SDK 字段。
- 新增 Schema 驱动的可发现性测试：每个封闭叶子必须为活动 YAML，空值字段必须带已验证的行尾示例；对象数组与动态映射容器必须登记并命中配置中的结构契约。
- 复用现有 `CONFIG_SCHEMA`、`js-yaml` 和 Node.js test runner，不增加依赖、运行时接口或第二份配置 Schema。

## 3. 影响范围

- 只改变主题默认配置的说明能力和测试门禁，不改变配置名称、默认值、归一化结果或页面输出。
- Collection YAML 与 Front Matter 继续由各自的 Reference 和知识库说明，不并入主题 `_config.yml`。
- 同步配置系统知识库与 `VERIFICATION.md`；不需要修改语言、模板、样式、客户端代码或主站公开 Wiki。

## 4. 验证方式

- 使用 `js-yaml` 校验 `_config.yml` 仍可解析，并通过新增可发现性测试。
- 运行 `npm run check` 与知识库硬事实核查。
- 在主工程运行 `npm run g`，确认注释补全不改变构建结果。
