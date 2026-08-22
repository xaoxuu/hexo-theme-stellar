---
title: Stellar v2 配置全景契约检查清单
date: 2026-08-22
---

# 检查清单 / 验证记录

## 契约

- [x] 22 个主题默认顶层域恰好登记一次
- [x] 站点专属 `inject`、遗留 `cache/language_switcher`、Collection、Front Matter、Hexo 输入、主题数据与派生对象有明确归属
- [x] 每个域都有字段树、消费方、最终路径、边界、状态和迁移切片
- [x] Stellar 自有旧命名具有 snake_case 目标，第三方参数袋具有显式豁免边界
- [x] 五个迁移切片无重复、遗漏或未知域
- [x] 当前运行时 Schema 与配置 Reference 仍只交付 canonical

## 验证

- [x] `node --test test/config-inventory.test.js` 通过（7 项）
- [x] 新增文件 ESLint 检查通过
- [x] `npm run check` 通过（246 项测试，双 Reference 无漂移，提交登记完整）
- [x] 主工程 `npm run g` 通过（生成并压缩 254 个文件）
- [x] `python3 docs/knowledge/tools/verify.py` 通过（行号异常 0、版本不一致 0）
- [x] Standards / Spec 双轨复核通过，无剩余 actionable findings

## 文档与状态

- [x] 配置架构知识库和 `VERIFICATION.md` 已更新
- [x] 主工程 v2 总蓝图登记 #703 配置全景契约
- [x] 公开 Wiki、迁移说明、页面抽查、CSS、语言文案、重定向和 SEO 行为为 N/A：本切片不改变公开配置或运行时输出
- [x] issue #703 已准备交付证据，将由 `resolved` 标签触发 CI 关闭
