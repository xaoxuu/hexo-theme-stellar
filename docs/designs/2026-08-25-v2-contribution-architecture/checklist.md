---
title: Stellar v2 贡献架构与一致性 CI 检查清单
date: 2026-08-25
issue: 725
---

# 检查清单 / 验证记录

## 契约与运行时

- [x] Extension、Feature 与 Runtime 可注册组件共用完整描述契约。
- [x] Runtime Manifest 只从贡献注册表投影内置声明。
- [x] 既有 Extension 顺序、激活条件、配置投影与深冻结不变。
- [x] Card Hover 使用独立 ESM adapter，不再出现于 Manifest 白名单或通用 Feature dispatch。

## CI 门禁

- [x] 重复 ID/注册与重复 Schema 默认值所有者可定位拒绝。
- [x] 缺失任意内置语言键可定位拒绝。
- [x] Schema/Reference 缺失或重复可定位拒绝。
- [x] 未登记、重复所有或不存在的 asset 可定位拒绝。
- [x] 缺失入口、文档、测试文件或 ID 行为断言可定位拒绝。
- [x] contribution gate 已接入 `npm test` 与 GitHub Actions。

## 文档与验证

- [x] 贡献指南覆盖配置、内容 profile、服务端功能、UI 组件、浏览器 Extension、标签插件和语言文案。
- [x] Card Hover 演练从实现、descriptor、Schema、测试到文档可复现。
- [x] Node.js 22 `npm run check` 通过：lint、400 项测试、Contribution/Reference、首屏 gzip 46.5581%、知识库与提交登记均通过。
- [x] `npm run integration:check` 三套 npm tarball 的 init → doctor → generate 全部通过。
- [x] 主工程 `npm run g` 通过，Hexo 生成 262 个文件并完成压缩；实际 HTML 投影独立 Card Hover ESM。
- [x] Standards / Spec 双轴复审无剩余 finding；复审中修正旧 `runtime.modules` 测试成为真实 descriptor 所有权断言，并保留 Card Hover `config.feature` Manifest 形状。
- [x] 公开配置、URL、DOM、CSS、语言文案、Runtime Manifest 格式、迁移/SEO 跳转、npm 发布与 tag 均为 N/A。
- [x] M8 完成后 M9、M10 与 Alpha 1 仍保持未完成。
