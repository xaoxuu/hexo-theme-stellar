---
title: Navbar 玻璃效果触发阈值微调检查清单
date: 2026-08-17
---

# 检查清单 / 验证记录

## 验证

- [ ] 主工程 `npm run s`：wiki 等无轮播页面顶部（滚动 0）navbar 为卡片样式
- [ ] 主工程 `npm run s`：无轮播页面滚动 ≥2px 后 navbar 变玻璃
- [ ] 主工程 `npm run s`：滚回顶部（滚动 <2px）恢复卡片
- [ ] 主工程 `npm run s`：首页等有轮播页面行为与改动前一致
- [x] 冒烟验证：本地服务 wiki 页含 `.navbar.top`/`.navbar-blur` 且无轮播区；`/js/main.js` 已加载 `SCROLL_THRESHOLD` 新逻辑
- [x] `node --check source/js/main.js` 语法通过
- [x] `python3 docs/knowledge/tools/verify.py` 已运行：无行号异常；唯一版本不一致（installation.md 1.42.0 vs 1.42.1）为改动前已有，非本次引入

## 文档同步

- [x] `docs/knowledge/05-前端交互/client-side-overview.md` 已更新
- [x] `docs/knowledge/VERIFICATION.md` 已登记
- [x] 主仓库 `source/wiki/stellar/advanced-settings.md` 已同步并刷新 `updated`
