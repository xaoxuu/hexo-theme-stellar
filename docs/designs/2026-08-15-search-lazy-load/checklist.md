---
title: 本地搜索懒加载与缓存 TTL 检查清单
date: 2026-08-15
---

# 检查清单 / 验证记录

## 验证

- [x] 主工程 `npm run g` 全量构建通过（涉及 `source/js`）
- [x] `python3 docs/knowledge/tools/verify.py` 知识库硬事实核查通过
- [ ] 手工：默认配置页面加载无 `search.json` 请求，聚焦才请求
- [ ] 手工：缓存新鲜时点击即出结果且无请求
- [ ] 手工：缓存过期时先用旧缓存出结果并后台刷新
- [ ] 手工：`cache_ttl: 0` 每次聚焦请求、不写缓存
- [ ] 手工：断网时有缓存可搜、无缓存可重试
- [ ] 手工：`lazy_load: false` 页面加载仍初始化且缓存新鲜不请求
- [ ] 手工：输入框已有文字时懒加载完成能立即出结果

## 文档同步

- [x] `docs/knowledge/07-外部集成/search.md` 更新
- [x] `docs/knowledge/09-高级主题/performance.md` 更新
- [x] `docs/knowledge/知识库全量.md` 同步
- [x] `docs/knowledge/VERIFICATION.md` 登记
