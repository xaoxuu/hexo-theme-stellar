---
title: Stellar v2 Reference 与 Alpha 集成方案
date: 2026-08-23
status: M5 已完成，Alpha 候选基线
issue: 718
---

# 1. 问题与目标

Pre-alpha M1–M4 已交付严格 Schema、四类完整渲染消费链、Blueprint/CLI 和浏览器 Extension 运行时，但当前 `reference/v2-*.json` 仍只是机器产物，README 也只指向 v1 文档。已有 Blueprint 构建门禁通过源码软链接和宿主 `node_modules` 运行，尚未证明 npm tarball 可以在隔离的 Hexo 8 工程安装并带齐 Blueprint、Reference 和运行时文件。

本切片完成 M5：从既有 Schema/manifest 单源生成公开可读 Reference，提供最小 Alpha 使用与范围说明，并建立预发布包安装到三套干净工程的端到端验收。M5 与当前自动门禁（包括首屏核心 JS gzip 阈值）同时通过后，只建立 `2.0.0-alpha.1` 字符的本地候选基线；是否进入 Alpha 1 仍受 M6–M11 与站长人工验收约束，本 issue 不执行 npm publish。

# 2. 公开 Reference

- `reference/README.md` 是 npm 包和 GitHub 中的 Reference 入口，链接配置、模型、Blueprint/CLI 与 Alpha 指南。
- `reference/v2-config.md`、`reference/v2-models.md`、`reference/v2-blueprints.md` 与三份 JSON 一起由 `scripts/generate-reference.js` 稳定生成；Markdown 不维护独立字段表。
- 配置与模型字段逐项展示 path、type、default、scope、consumer 与最小 example；配置额外展示 runtime path、cascade/normalizer 和约束，模型按 profile 分组。
- Blueprint 页直接消费 manifest 与 CLI 契约，列出默认 Style、生成文件、可选值和命令示例。
- `npm run reference:check` 同时阻止 JSON、Markdown、索引和相对链接漂移；生成内容不带时间戳，重复运行字节稳定。

# 3. 最小 Alpha 文档

- 根目录 `ALPHA.md` 说明 Node.js 22 / Hexo 8 前提、预发布包安装、`stellar init`、`stellar doctor`、三套 Blueprint 和两套 Style 的最短命令，以及冲突拒绝规则。
- 文档明确列出 Alpha 中仍不稳定的 Schema、CLI、构建期 ViewModel 与内部浏览器诊断事件；完整产品首页、学习路径、v1 归档、迁移对照、重定向和 SEO 集成继续属于 Beta。
- README 只增加 v2 Alpha 入口，不替换当前稳定版安装和 v1 文档链接；npm 包必须包含 `ALPHA.md` 与 `reference/`。

# 4. 预发布包与端到端门禁

- `ci/check-alpha-integration.js` 在临时目录创建 `npm pack` tarball，并用 npm 把 tarball 安装到三个互相隔离的 Hexo 8 / Node.js 22 工程；不得通过主题源码或宿主 `node_modules` 软链接绕过包装边界。
- 三套工程分别执行非交互 init、JSON doctor 和 generate；Classic Blog、Minimal Reading、Docs Reference 保持各自公开 starter 输出。
- 集成 fixture 在生成计划之外为验收站点补入 Topic 与 Notebook 内容，使三站总体覆盖 post、wiki、topic、notebook。页面 HTML 必须带对应 profile/ViewModel 输出标志、合法 Runtime Manifest 和唯一 `type=module` runtime 入口。
- 打包清单断言 Blueprint、Reference、Alpha 文档、EJS、Schema 与浏览器 runtime 存在，并拒绝 `test/`、`ci/`、`docs/knowledge/`、`.agents/` 和 lockfile。
- 集成命令不发布包、不写仓库文件，失败或成功均清理临时目录；可通过环境变量保留目录用于诊断。

# 5. 性能门禁

- 以同一最小 Classic Blog 输入分别构建固定 v1 基线（tag `1.44.0`）与当前 v2 tarball。
- “首屏核心 JS”固定为首页 HTML 中无条件输出的本地 script/module 资源；dynamic import、selector 未命中的 Extension、搜索和数据服务不计入首屏核心。每个唯一资源按生成产物 gzip level 9 后求和，内联可执行脚本按同一规则计入。
- 生成 `reference/v2-alpha-performance.json`，登记基线 tag、资源清单、gzip 字节和降幅；阈值固定为至少 30%。统计与检查共享同一实现，未达标时 Alpha 集成命令失败且 Alpha 1 保持未完成。

# 6. 版本与边界

- M5 可以完成而 Alpha 1 仍因任一端到端门禁失败保持未完成；状态文档必须分别记录。
- 只有全部 M5 门禁通过后才把 v2 分支包版本更新为 `2.0.0-alpha.1` 候选字符。根据后续扩展的 v2 总蓝图，是否进入 Alpha 1 仍由 M6–M11 与站长人工验收决定；本 issue 只推送 `origin/v2`，不创建 tag、不发布 npm。
- 不新增或修改公开 YAML/Front Matter 字段、页面 URL、DOM、CSS、语言文案或客户端公共 API。
- 主仓库只更新 `docs/specs/stellar-v2-blueprint/{spec,plan,checklist}.md` 且保持未提交；不修改 `source/`，不更新子模块指针。

# 7. 验收

- Reference JSON/Markdown 稳定同源，字段注解完整，链接与锚点检查通过。
- Alpha 命令/YAML 示例通过实际 CLI、doctor 和 Schema；不存在第二套字段白名单。
- tarball 三站 init → doctor → generate 通过，四类 profile 与 Extension runtime 可从生成结果验证。
- 首屏核心 JS gzip 相比固定 v1 基线至少下降 30%。
- `npm run reference:check`、`npm run check`、知识库核查、主工程 `npm run g` 和 Standards/Spec 双轨 review 无剩余 finding。
