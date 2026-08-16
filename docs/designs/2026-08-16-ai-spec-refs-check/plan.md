---
title: AI 规范引用一致性检查执行计划
date: 2026-08-16
---

# 执行计划

## 实施步骤

1. [x] 修正 AGENTS.md §2 小部件路径（`layout/_partial/sidebar/` → `layout/_partial/widgets/`）
2. [x] 修正 CONTRIBUTING.md §6→§4 并补 CI 检查表行
3. [x] skill §3 删除重复行并同步 `.claude/` 镜像（`node ci/check-skill-sync.js`）
4. [x] 新增 `ci/check-spec-refs.js`（章节引用 / 门禁措辞 / 路径存在性）
5. [x] `package.json` `test` 脚本接入 `check-spec-refs`
6. [x] 运行验证：check-spec-refs、check-skill-sync --check、`npm run check`、`rg` 抽查
7. [x] 方案文档与检查清单归档

## 风险与回退

- 路径检查误报：仅检查命中仓库根前缀的反引号路径，占位符 / 通配符与主工程 / demo 路径跳过；若再遇误报，扩展跳过规则即可
- 章节重排导致引用失效：`check-spec-refs` 的 §N 检查在 CI 强制拦截
- 镜像不同步：`check-skill-sync --check` 在 CI 强制拦截
