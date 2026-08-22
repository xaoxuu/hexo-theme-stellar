---
title: Stellar v2 canonical 配置 Schema 检查清单
date: 2026-08-22
---

# 检查清单 / 验证记录

## 契约

- [x] Schema、解析器与 Reference 使用同一字段定义
- [x] v2 YAML 只接受 `original_host` / `official_hosts`
- [x] 结构化诊断包含 code、来源、路径、实际类型、期望结构和迁移标识
- [x] `hexo.stellar.config` 与 canonical 子树深度冻结
- [x] Post、迁移期页面与浏览器上下文消费同一规范化结果

## 验证

- [x] `npm run check` 通过（239 项测试，Reference 无漂移，提交登记完整）
- [x] 主工程 `npm run g` 通过（生成并压缩 254 个文件）
- [x] 普通 Post、Topic Post、Wiki 与 Notebook 页面抽查通过
- [x] canonical、OG 与 JSON-LD 回归通过
- [x] `python3 docs/knowledge/tools/verify.py` 通过（行号异常 0、版本不一致 0）
- [x] Standards / Spec 双轨复核通过，无剩余 actionable findings

## 文档与状态

- [x] 配置与 canonical 知识库已更新
- [x] `docs/knowledge/VERIFICATION.md` 已登记
- [x] 主工程 v2 总蓝图标记 M1.5 部分交付
- [x] 公开 Wiki、重定向、CSS 与语言文案为 N/A；本切片不新增公开页面、URL、样式或文本
- [x] sitemap 与 robots 行为为 N/A；SEO 抽查确认既有输出未改变
