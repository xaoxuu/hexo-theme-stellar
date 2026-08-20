---
title: Footer Social 复用 Collection Surface 交互检查清单
date: 2026-08-20
---

# 检查清单 / 验证记录

## 验证

- [x] Footer Social 默认、hover 与 dropdown open 状态消费正确的 surface 令牌
- [x] 编译 CSS 保留 glass/card 对应 collection 交互令牌映射
- [x] 图标、尺寸、spacer 和 dropdown 浮层相关规则未改动
- [x] 主工程 `npm run g` 全量构建通过（252 个文件）
- [x] `python3 docs/knowledge/tools/verify.py` 知识库硬事实核查通过（行号异常、版本不一致均为 0）

## 文档同步

- [x] `docs/knowledge/` 对应领域已更新
- [x] `docs/knowledge/VERIFICATION.md` 已登记
- [x] 主工程 Stellar Wiki 已更新并刷新 `updated`
- [x] 无新增语言文案
