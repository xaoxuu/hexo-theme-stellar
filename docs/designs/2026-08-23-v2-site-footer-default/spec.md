---
title: Stellar v2 site Footer 默认文案修正
date: 2026-08-23
status: 已实施
---

# site Footer 默认文案修正方案

## 1. 问题与目标

#704 冻结最终配置契约时把 `site.footer.content` 的默认值误写为空字符串，#706 按该契约迁移后，未覆盖 Footer 的站点不再显示主题署名。主工程显式配置了 Footer 文案，因此既有构建没有暴露该回归。

本次恢复主题自带的 Markdown 署名文案，并让 `_config.yml`、声明式 Schema、运行时默认、配置 Reference、测试和知识库保持一致。

## 2. 技术方案

- `site.footer.content` 默认值恢复为 `本站由 [{author.name}](/) 使用 [{theme.name} {theme.version}]({theme.tree}) 主题创建。`。
- 继续复用 `layout/_partial/main/footer.ejs` 已有的 Markdown 渲染和四个占位符替换，不修改模板、DOM、样式或客户端代码。
- 不恢复旧版全站文章许可句；文章许可继续由 `content.article.footer.license` 管理，避免站点外壳与内容默认值职责重叠。
- 站点仍可用空字符串显式覆盖默认值并隐藏主 Footer 文案。

## 3. 影响范围

- 配置与 Schema：`_config.yml`、`scripts/schema/config-target.js`、`scripts/schema/config-schema.js`。
- 契约证据：`test/config-schema.test.js`、`reference/v2-config.json`。
- 内部文档：`docs/knowledge/00-总览与安装配置/configuration.md`、`docs/knowledge/VERIFICATION.md`。
- 不修改主工程配置、公开 Wiki、URL、SEO、样式、国际化或浏览器行为。

## 4. 验证方式

- 解析空主题配置，断言 `site.footer.content` 得到完整主题署名；解析显式空字符串，断言仍可隐藏默认文案。
- 生成并检查 `reference/v2-config.json`，确认字段默认值与 Schema 一致。
- 执行主题 `npm run check`、知识库硬核查与主工程 `npm run g`。
