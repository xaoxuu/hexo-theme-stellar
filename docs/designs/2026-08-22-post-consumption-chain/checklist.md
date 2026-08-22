---
title: Stellar v2 普通 Post 内容与列表消费链检查清单
date: 2026-08-22
---

# 检查清单 / 验证记录

## #701 验收

- [x] Post `PageViewModel.render` 包含必需 `article` 与 `listing`。
- [x] 普通 Post 详情内容和列表条目只消费显式 ViewModel locals。
- [x] 相关文章插件缺失错误包含源文件；禁用时不要求插件。
- [x] Topic、Wiki、Notebook 未提前接管。
- [x] DOM、class、CSS、URL 与用户可见行为保持等价。

## 验证

- [x] Post 模型、Schema 与 Reference 单测通过。
- [x] 详情内容和列表模板回归通过。
- [x] `npm run check` 通过（233 项测试）。
- [x] 主工程 `npm run g` 通过（生成并压缩 254 个文件）。
- [x] 普通 Post `/blog/20260226/`、首页、分类、标签、归档、Topic Post `/blog/20260815/` 与 Wiki 页面生成抽查通过。
- [x] 知识库硬事实核查通过（既有未解析文件 47、配置键异常 8；行号异常 0、版本不一致 0）。

## 状态与文档

- [x] 主题相关知识库与 `VERIFICATION.md` 已同步。
- [x] 主工程总蓝图登记 Post 消费链完成，M2 与 Alpha 1 保持未完成。
- [x] 公开配置、公开 Wiki、迁移、SEO、CSS 与客户端 API 为 N/A。
