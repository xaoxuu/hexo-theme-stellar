---
title: Stellar v2 配置根封闭检查清单
date: 2026-08-23
---

# 检查清单 / 验证记录

## 契约与实现

- [x] `_config.stellar.yml` 只允许八个公开根域。
- [x] 主题 `_config.yml` 不再声明 `stellar/system`。
- [x] package 元数据、核心资源与 pretty URL 策略已内部化。
- [x] `cache/language_switcher` 不存在兼容读取。
- [x] Hexo 配置、Hexo Front Matter、主题数据与派生对象有明确排除边界。
- [x] 内部数据只挂载到 `hexo.stellar.data`，消费方不再读写 `theme.config` 派生键。
- [x] 配置 Reference 只包含八根已交付契约。

## 验证与闭环

- [x] 主题 `npm run check` 与双 Reference 检查通过（292 项测试）。
- [x] 知识库硬核查通过。
- [x] 主工程 `npm run g` 通过（254 个文件）；已抽查 `/`、`/blog/20260226/`、`/blog/20260815/`、`/wiki/stellar/`、`/notes/` 的标题、canonical、核心 CSS/JS 与主题元数据。
- [x] Standards / Spec review 无剩余 finding。
- [ ] 主题提交已推送 `origin/v2`，#712 已评论证据并以 `resolved` 闭环。
- [x] 主工程保持未提交且未提交子模块指针。

## 阶段状态

- [x] Pre-alpha M1.5 全部门禁已交付。
- [x] M2 与 Alpha 1 保持未完成。
