---
title: Stellar v2 普通 Post 渲染内核检查清单
date: 2026-08-22
---

# 检查清单 / 验证记录

## #700 验收

- [x] Post PageViewModel 保留 collection/item 并新增必需 render 投影。
- [x] Schema 校验、模型构建与 Reference 生成消费同一事实来源。
- [x] 五类布局原语只接收显式 locals，并拒绝未知 slot/kind。
- [x] 普通 Post 的根布局、侧栏导航、Brand、菜单、面包屑和 SEO 消费 ViewModel。
- [x] 普通 Post 缺少 render 时构建失败；Topic/Wiki/Notebook 未提前接管。
- [x] DOM、class、CSS、URL 与用户可见行为保持等价。

## 验证

- [x] Post 模型与 Reference 单测通过。
- [x] 布局原语与模板消费链单测通过。
- [x] `npm run check` 通过（226 项测试）。
- [x] 主工程 `npm run g` 通过（生成并压缩 254 个文件）。
- [x] `/blog/20260226/` 的布局、侧栏、面包屑、canonical、OG、Twitter 和 JSON-LD 通过。
- [x] `/blog/20260815/` 与 Wiki 页面抽查通过。
- [x] 知识库硬事实核查通过（行号异常 0、版本不一致 0；既有未解析项保持基线）。

## 状态与文档

- [x] 主题内容模型、布局、侧栏、head/SEO 与 VERIFICATION 已同步。
- [x] 主工程总蓝图登记 M2 部分交付，M2 与 Alpha 1 保持未完成。
- [x] 公开 Wiki、配置迁移、URL 与 CSS/客户端行为为 N/A，并已说明原因。
