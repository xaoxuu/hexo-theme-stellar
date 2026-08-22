---
title: Stellar v2 Collection 与 Front Matter 配置 Schema 检查清单
date: 2026-08-23
---

# 检查清单 / 验证记录

## 契约与实现

- [x] Collection / Front Matter 全部目标节点具有 delivered 状态和声明式 Schema。
- [x] YAML snake_case 输入生成深冻结 camelCase 对象。
- [x] Hexo-owned Front Matter 保持原名并排除于 Stellar Reference。
- [x] Collection / Page 消费链不再读取旧字段。
- [x] 主工程真实配置已迁移且正文 `updated` 未被刷新。
- [x] 配置 Reference 只投影 delivered 节点且无 planned 泄漏。

## 验证与闭环

- [x] `npm run check` 通过（278 项测试，双 Reference 无漂移）。
- [x] 知识库硬核查通过。
- [x] 主工程 `npm run g` 生成并压缩 254 个文件，日志无 `ERROR/FATAL`，关键产物抽查通过。
- [x] Standards / Spec review 无剩余 finding。
- [ ] 主题提交已推送 `origin/v2`，#709 已评论证据并以 `resolved` 闭环。
- [x] 主工程保持未提交且未提交子模块指针。

## N/A

- [x] 视觉样式、浏览器交互和依赖变化为 N/A。
- [x] URL 与页面内容正文变化为 N/A；81 个 Markdown 文件的 body 对比为 0 处变化。
