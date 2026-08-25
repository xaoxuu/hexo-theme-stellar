---
title: Stellar v2 M10 全系统回归与人工验收候选
status: 等待站长重新验收
issue: 720
---

# 问题

M1–M9 已分别交付配置、内容、Runtime、Blueprint、CLI 与默认体验，但现有 `ci/check-package-integration.js` 仍只是 M5/M9 基线：它没有固定验证三种语言、搜索索引、主要路由、init 的完整事务边界，以及旁路/原地两条迁移旅程。现有 `m10-acceptance.md` 也只有说明文字，不能生成带候选包哈希、站点目录、待测 URL 和问题记录表的固定人工验收包。

首轮人工验收反馈进一步证明，仅通过 `generate` 不足以交付可启动的固定验收站点：隔离工程没有安装 `hexo-server`，所以正确的 `hexo server` 只显示 Hexo 通用帮助；`hexo stellar server` 则会按设计被 Stellar CLI 拒绝。验收矩阵必须安装固定版本的预览服务器，并以真实 HTTP 200 响应证明报告中的 `npx hexo server --ip 127.0.0.1` 可用。

修复后的真实预览还暴露出版本检查把“版本不相等”误当成“远端更新”：本地 `2.0.0-alpha.1` 会被提示安装 npm `latest` 的 `1.44.0`。版本提示必须使用 SemVer 顺序，只在 registry `latest` 严格较新时出现；非法版本应静默跳过，不能给出反向升级建议。

第二轮人工验收发现文章列表底部 meta 的日历图标为空，空 `<svg>` 在 flex 容器中被拉伸并挤压时间。浏览器控制台同时报告 `deferred-icons` 以 `feature: undefined` 进入共享 Feature adapter。根因是 Runtime Manifest 只按 contribution 的产品类型 `kind=feature` 注入分派 ID，却遗漏了 `kind=component`、`entry.adapter=feature` 的 `deferred-icons`、`dropdown` 与 `swiper`。Manifest 投影必须按 adapter 契约补齐共享分派 ID，同时保留独立 Feature 现有配置形状。

# 用户结果

站长可以从当前 `v2` 源码一次生成可复现的本地候选验收包。自动门禁使用真实 npm tarball，在隔离 Hexo 8 工程验证默认空配置、三套 Blueprint、三种语言、四类 Collection、CLI、Reference、Runtime Manifest、搜索索引、主要路由和两条迁移旅程；生成模式另外保留站点与报告，供桌面端和移动端人工检查。

# 接缝

- `npm run integration:check`：执行 M10 自动矩阵，成功后删除临时工程。
- `npm run acceptance:prepare -- --output <absolute-directory>`：执行同一矩阵，并在显式空目录中保留 tarball、生成站点、`acceptance-report.json` 与 `issues.md`。
- `ci/check-package-integration.js`：矩阵、断言与报告的唯一实现；检查模式和生成模式不维护两套逻辑。
- `test/fixtures/v2-system-acceptance/`：只保存显式迁移前/迁移后输入，不提供自动迁移器。

# 自动矩阵

- 默认站点：缺失 `_config.stellar.yml`，普通 Post/Page 与默认 Markdown。
- Blueprint：Classic Blog / `en` / `stellar`、Minimal Reading / `zh-CN` / `minimal`、Docs Reference / `zh-TW` / `stellar`。
- Collection：Post、Wiki、Topic、Notebook 的真实 ViewModel、主要详情/聚合路由、Runtime Manifest 与唯一 ESM 入口。
- CLI：init dry-run 与真实计划一致；已有目标整体拒绝；写入中途失败回滚本次文件且保留用户文件；new note dry-run/写入/冲突拒绝；doctor text/json 结果一致。
- 产物：Reference 与 Blueprint manifest 打包边界、`search.json` 内容、语言输出与主要 URL。
- 预览：每个隔离站点安装固定 `hexo-server`；六个站点逐一启动 `hexo server`，并通过本机 HTTP 请求验证首页返回 200 与 Stellar Shell。
- 迁移：旁路 fixture 先 init 干净骨架，再用显式 v2 输入替换 starter；原地 fixture 不运行 init，先证明 doctor 定位 v1 字段及迁移章节，再替换为显式 v2 输入。两者均证明正文哈希不变并通过 doctor/generate。

# 边界

- 不发布 npm，不创建 tag、GitHub Release 或 dist-tag。
- 不把内置 Blueprint manifest 扩展为第三方格式，不增加运行时兼容读取或自动迁移器。
- 不修改公开 URL、DOM、CSS、语言文案、Schema 或 Runtime Manifest 契约。
- 修复只补全既有 Runtime Manifest 内部 `config.feature` 分派字段，不引入公开配置、资源或布局规则。
- 主仓库只更新三份 v2 蓝图状态文档；不提交主仓库，不更新子模块指针，也不触碰既存内容改动。
- 自动门禁通过后状态只能是“等待站长人工验收”；#720 与 Alpha 内部里程碑仍由站长明确结论决定。

# 验收标准

- Node.js 22 / Hexo 8 / npm 10+ 下自动矩阵通过。
- `npm run check`、`npm run performance:check`、Reference 漂移检查和主工程 `npm run g` 通过。
- 生成模式的报告包含候选 tarball SHA-256、环境、矩阵结果、站点路径、待测 URL、预期结果与问题记录入口。
- Standards / Spec 复审无剩余 finding；主题提交到达 `origin/v2` 后向 #720 评论自动证据，但不添加 `resolved`。
