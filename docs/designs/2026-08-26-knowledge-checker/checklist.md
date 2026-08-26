---
title: 知识库严格门禁检查清单
date: 2026-08-26
---

# 检查清单 / 验证记录

## 验证

- [x] Node.js 22：`node --test test/knowledge-check.test.js`，3/3 通过
- [x] `npm run knowledge:check`：61 页、1152 个链接、248 个配置引用、2 个版本引用，零发现
- [x] `node ci/check-spec-refs.js`：agent 规范权威与指针通过
- [x] `npm run schema:check`：默认配置、Reference 与配置审计均为当前版本
- [x] Node.js 22：`ci/check-performance.js --check`，首屏核心脚本 gzip 降幅 50.5052%，通过
- [x] 本次相关文件 ESLint 通过
- [~] `npm test`：429/432 通过；3 项既有 Blueprint/doctor 用例因 `appearance.backgrounds.sidebar.image/opacity` 与 Schema 默认值重复而失败，相关文件无本次 diff
- [~] `npm run check`：被既有 `test/config-discoverability.test.js:71-74` 四个 `no-regex-spaces` ESLint 错误提前阻断，相关文件无本次 diff
- [x] `git diff --check`

## 文档同步

- [x] AGENTS、CONTRIBUTING、知识库 README 与 CI 只引用 `npm run knowledge:check`
- [x] 当前失效链接和过时配置事实已经修正并登记到 `docs/knowledge/VERIFICATION.md`
- [x] Python 脚本、报告缓存、pycache 与 ripgrep 依赖已经移除
- [x] 最终 diff 不改变主题运行时、公开配置或渲染行为；无需主工程 Hexo 构建
