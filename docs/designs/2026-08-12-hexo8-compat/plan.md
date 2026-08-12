---
title: Hexo 8 兼容适配执行计划
date: 2026-08-12
---

# 执行计划

## 实施步骤

1. [x] 主工程 `package.json`：`hexo` ^8.1.2、`hexo.version` 8.1.2、`hexo-renderer-marked` ^7.0.1、`hexo-generator-index` ^4.0.0、`hexo-generator-feed` ^4.0.0
2. [x] `npm install`（临时缓存目录规避 `~/.npm` 权限问题）→ `npx hexo version` 确认 8.1.2
3. [x] 主工程 `npm run g` 全量构建；在临时目录重建 Hexo 7.3.0 基线（同主题提交、同内容）并对比分类
4. [x] 修复 marked 15 严格 CommonMark 导致的 7 处 `**…：**汉字` 加粗失效（改写为 `<strong>`）
5. [x] 页面抽查 + XML/JSON 校验 + 本地服务冒烟（`hexo server` 端口 4100，curl 关键页面 200）
6. [x] 主题仓库方案文档 `docs/designs/2026-08-12-hexo8-compat/`
7. [x] 同步知识库：`installation.md` / `advanced-overview.md` / `知识库全量.md` / `VERIFICATION.md` / README.md
8. [x] CI integration job 安装 Hexo 8 + 配套插件版本
9. [x] 主题仓库 `npm run check` 全绿

## 风险与回退

- marked 15 严格解析导致存量内容加粗失效：已全站扫描并修复现存 7 处；若后续内容再次出现该写法，回退选项为保持 `hexo-renderer-marked` ^6.3.0。
- `hexo-autonofollow` / `hexo-generator-seo-friendly-sitemap` 等老插件在 Hexo 8 下异常：本次全量构建与冒烟均通过；若部署或 CI 环境出现异常，autonofollow 可移除（主题自带 `rel` 处理 + Hexo core external_link），sitemap 可替换为 `hexo-generator-sitemap@3.0.1`。
- `hexo server` 在受限执行环境内报 EMFILE：属执行环境 fd 限制，与升级无关；正常终端环境无此问题（已在沙箱外验证通过）。
