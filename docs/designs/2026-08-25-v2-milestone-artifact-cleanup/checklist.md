---
title: Stellar v2 里程碑产物清理验证记录
date: 2026-08-25
---

# 验证清单

## 契约

- [x] `ALPHA.md`、公开 Alpha 安装入口和 Alpha/Beta 对外发布承诺已移除；有效步骤已迁入 `m10-acceptance.md`。
- [x] 公共 Reference 只包含配置、模型与 Blueprint/CLI 契约。
- [x] 配置审计和性能基线仍由 CI 检查，但不进入 npm tarball。
- [x] Alpha/Beta 目标版本无法通过正式发版入口或 npm workflow 门禁。
- [x] M10 保持未完成状态。

## 验证

- [x] `npm run reference:generate`
- [x] Node.js 22.23.2 下 `npm run check`：412 项测试、Reference 漂移、性能、知识库和提交登记通过
- [x] `npm run integration:check`：三套 Blueprint 与无 init 默认站点通过
- [x] `npm run performance:check`：首屏核心 JS gzip 降低 46.5581%
- [x] `npm pack --dry-run --json`：452 项，`ALPHA.md`、审计、性能基线、`docs/`、`ci/`、`test/`、Skill 与缓存禁入项为 0
- [x] 主工程 `npm run g`：生成并压缩 262 个文件
- [x] 知识库硬事实核查：版本不一致 0、行号异常 0；既有未解析文件/配置键清单未扩大为失败

## 不适用

- [x] 主题运行时、Schema、CLI、URL、DOM、CSS 与语言文案变更：N/A。
- [x] 公开 Wiki、迁移跳转和 SEO 变更：N/A。
- [x] npm 发布、tag、GitHub Release 与主仓库子模块指针更新：N/A。
