---
title: Stellar v2 head 与 SEO 配置验收记录
date: 2026-08-22
status: 已实施
issue: 705
---

# 验收清单

- [x] 最终 YAML 路径和冻结 JavaScript 路径均已接入。
- [x] 本切片目标节点标记为 `delivered`，规划节点仍不进入运行时或 Reference。
- [x] 旧主题字段、未知字段与错误类型提供结构化诊断。
- [x] Post、迁移期页面、JSON-LD、head 与浏览器 canonical 不再读取旧主题路径。
- [x] Hexo `_config.yml.inject` 不再消费；站点/页面注入顺序和换行契约通过测试。
- [x] canonical、OG、Twitter、JSON-LD 与 preconnect 生成输出通过回归。
- [x] 主题 `npm run check` 通过（262 项测试通过）。
- [x] 知识库硬核查通过。
- [x] 主工程 `npm run g` 通过（生成并压缩 254 个文件），生成产物抽查通过。
- [x] Standards / Spec 双轨 review 无剩余问题。
- [x] 主题 `v2` 已提交并推送，#705 已附证据并标记 `resolved`。

公开 Wiki、URL、robots、sitemap、重定向、样式与客户端协议变更：N/A；本切片是未发布 v2 配置路径迁移，并保持现有输出语义。
