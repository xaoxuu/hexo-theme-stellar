---
title: 主题基础功能图标键统一为 default:语义名 检查清单
date: 2026-08-15
---

# 检查清单 / 验证记录

## 验证

- [x] `npm run check` 通过（lint + 单测 + 知识库硬事实核查）
- [x] 主工程 `npm run g` 通过
- [x] 全仓库无旧 `solar:*` 基础键残留引用
- [x] 生成产物 SVG 路径与改名前一致（值未变）；客户端注册表 5 键解析正常
- [x] 修正后复查：`weibo:comment/repeat/like` 与 `image:onerror` 引用更新，`npm run check` 与主工程 `npm run g` 通过
- [x] `solar:*` 全部消除后复查：copy/image/hashtag/quot 标签插件键引用更新，`npm run check` 与主工程 `npm run g` 通过
- [x] `ph:`/`bxs:` 消除后复查：quot:question/quote-left/quote-right 引用与 CSS 桥接更新，`npm run check` 与主工程 `npm run g` 通过
- [x] `example:` 命名空间引入后复查：config 注释示例与文档示例同步，`npm run check` 与主工程 `npm run g` 通过

## 文档同步

- [x] `docs/knowledge/` 对应页面已更新
- [x] `docs/knowledge/VERIFICATION.md` 已登记
