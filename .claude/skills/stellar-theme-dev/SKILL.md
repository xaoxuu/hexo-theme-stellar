---
name: stellar-theme-dev
description: 主题仓库（hexo-theme-stellar）开发全流程：方案 → 开发 → 验证 → 提交 → 发版。当任务涉及本仓库主题文件、构建验证、知识库更新或主题发版时使用。
---

# Stellar Theme Dev

主题仓库（hexo-theme-stellar）开发全流程。开始前先读仓库根 `AGENTS.md`（唯一权威）；本文件只给出执行顺序与完成条件。涉及主题代码、配置或行为问题时，先查 `docs/knowledge/` 对应领域，再读源码确认。

## 流程

### 1. 方案

- 先读 `AGENTS.md`「架构总览」（§6）与 `docs/knowledge/00-总览与安装配置/overview.md` 建立整体认知、定位改动范围。
- 在 `docs/designs/{YYYY-MM-DD}-{功能简称}/` 下建方案文档（模板 `docs/designs/_template/`，含 `spec.md` / `plan.md` / `checklist.md`）。
- 方案需写明：要解决的问题、技术方案与实现思路、影响范围、需同步的知识库页面与文档。
- 完成条件：方案文档已就位；改动范围与受影响维度已确认。

### 2. 开发

- 新增功能覆盖全部相关维度：`layout/` + `scripts/` + `source/css/` + `source/js/`（如需）+ `languages/`（如需）+ `docs/`。
- 新增或重构标签插件先读 `docs/guides/tag-plugins-style-guide.md`；代码遵循 `AGENTS.md` 编码规范。
- 完成条件：改动文件清单覆盖全部相关维度；涉及行为或配置变更时已同步 `docs/knowledge/` 并在 `VERIFICATION.md` 登记。

### 3. 验证

- UI 方面（样式、模板、前端交互等）改动量不大时无需验证，除非用户明确要求。

命令按需执行：

- `scripts/` 有改动 → 必须在主工程（xaoxuu.com）执行 `npm run g` 全量验证（已含 `hexo clean && hexo generate && npx gulp minify`）；`npm run s` 是按需渲染，不能替代。
- 新增/修改纯函数 → 补充单测并跑 `npm run check`（lint + 单测 + 依赖声明检查 + 知识库硬事实核查）。
- 知识库有改动 → `python3 docs/knowledge/tools/verify.py` 硬事实核查。
- UI 方面（样式、模板、前端交互等）改动量不大时无需自检流程，除非用户明确要求。
- 检查所有受影响页面类型（首页、文章页、Wiki 页等），验证结果记录在方案目录 `checklist.md`。
- 完成条件：应执行的命令全部通过；新增 `require` 均已声明或为 Node 内置模块（test/ 禁止幽灵依赖）；首页、文章页、Wiki 页等受影响页面类型均检查通过。

### 4. 提交

- 任务完成后**不自动提交**：改动保留在工作区供用户审查。
- 仅在用户明确要求提交时执行；提交前须通过第 3 步中应执行的验证。
- 使用 Conventional Commits，一次提交对应一个需求点；如果几个需求任务逻辑相似，可以合并为一次提交；类型与格式见 `AGENTS.md`「Git 规范」（§7）。
- 改动只提交在本仓库（stellar）；仅当用户明确要求时 push。
- 完成条件：改动已通过应执行的验证并保留在工作区；如用户要求提交，提交符合规范；如用户要求 push，已推送且远端为最新。

### 5. 发版

- 由用户触发时执行：分析自上一 tag 起的 commit 确定版本号 → 在 `CHANGELOG.md` 写入对应非空章节（H2 版本号 + H3 分类）→ 向用户确认版本号与变更摘要 → `npm run release:dry -- <version>` 预演 → 正式发版。
- 详见 `docs/guides/release-process.md` 与 `AGENTS.md`「发版规范」（§8）。
- 完成条件：版本号与变更摘要已获用户确认；dry-run 通过后完成正式发版。
