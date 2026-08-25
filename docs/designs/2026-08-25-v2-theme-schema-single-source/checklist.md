---
title: Stellar v2 Theme Schema 单源与 Brand 配置边界检查清单
date: 2026-08-25
---

# 检查清单 / 验证记录

## 契约

- [x] Theme Schema 不再从目标契约读取类型或默认值。
- [x] Brand 三字段均为字面量 `null`，主题解析不读取 Hexo avatar/title/subtitle。
- [x] 默认 `_config.yml`、Reference 与字段审计由统一 Schema 命令生成。
- [x] 每个活动叶子都有语义描述；缺失描述时 Schema 构造失败，不再生成 `<字段路径> 配置。`。
- [x] 类型、枚举、范围和数组元素提示由 Schema 约束生成；YAML 示例只在显式登记时输出。
- [x] 主站显式 Brand 与当前页面表现一致。

## 验证

- [x] Node.js 22 `npm run check`：423 项测试及全部门禁通过。
- [x] Node.js 22 `npm run integration:check`：四套 tarball fixture 通过。
- [x] `python3 docs/knowledge/tools/verify.py`：随 `npm run check` 通过。
- [x] 主工程 `npm run g`：262 个文件生成并完成压缩。
- [x] 配置知识库、公开 Wiki 与 `VERIFICATION.md` 已同步。
- [x] M10 与 Alpha 1 保持未完成。
