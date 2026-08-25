---
title: Stellar v2 自部署服务默认 endpoint 与静默降级检查清单
date: 2026-08-25
---

# 验证记录

- [x] 默认、自定义、`null` 和非法 URL 配置测试通过。
- [x] Rating/Vote 默认 markup 与 `null` 静态禁用态测试通过。
- [x] Site Info/Rating/Vote 成功和失败路径浏览器测试通过，失败无控制台输出或未处理 rejection。
- [x] 配置 Reference 已重新生成且漂移检查通过。
- [x] Node.js 22 下 `npm run check` 通过：380 项测试通过，首屏核心 JS gzip 降幅 46.5354%。
- [x] `python3 docs/knowledge/tools/verify.py` 通过。
- [x] 主工程 `npm run g` 通过，生成 261 个文件。
- [x] 主题与公开 Wiki 范围的 `git diff --check` 通过；主工程全量检查仅命中任务前已存在的 `source/_data/wiki/cloud-shell.yml:22` 行尾空白，本次不改动。

# 文档与交付

- [x] 主题数据服务知识库和 `VERIFICATION.md` 已同步。
- [x] 公开 Wiki 已同步并刷新正文 `updated`。
- [x] 主工程总蓝图三件套已登记 M6 契约修正，M7–M11 状态不变。
- [ ] 主题提交已推送到 `origin/v2`，#730 已评论证据并由 `resolved` 自动关闭。
- [x] 主仓库、公开 Wiki 和子模块指针保持未提交。
