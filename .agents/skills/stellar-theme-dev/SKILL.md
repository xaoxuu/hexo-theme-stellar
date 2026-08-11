---
name: stellar-theme-dev
description: 主题仓库（hexo-theme-stellar）开发全流程：方案 → 开发 → 验证 → 提交 → 发版。当任务涉及本仓库主题文件、构建验证、知识库更新或主题发版时使用。
---

# Stellar Theme Dev

主题仓库（hexo-theme-stellar）开发全流程。开始前先读仓库根 `AGENTS.md`（唯一权威）；本文件只给出执行顺序与完成条件。涉及主题代码、配置或行为问题时，先查 `docs/knowledge/` 对应领域，再读源码确认。

## 流程

### 1. 方案

- 在 `docs/designs/{YYYY-MM-DD}-{功能简称}/` 下建方案文档（模板 `docs/designs/_template/`，含 `spec.md` / `plan.md` / `checklist.md`）。
- 方案需写明：要解决的问题、技术方案与实现思路、影响范围、需同步的知识库页面与文档。
- 完成条件：方案文档已就位；改动范围与受影响维度已确认。

### 2. 开发

- 新增功能覆盖全部相关维度：`layout/` + `scripts/` + `source/css/` + `source/js/`（如需）+ `languages/`（如需）+ `docs/`。
- 新增或重构标签插件先读 `docs/guides/tag-plugins-style-guide.md`；代码遵循 `AGENTS.md` 编码规范。
- 完成条件：改动文件清单覆盖全部相关维度；涉及行为或配置变更时已同步 `docs/knowledge/` 并在 `VERIFICATION.md` 登记。

### 3. 验证

命令按需执行：

- 主题仓库 `npm run check`（lint + 单测 + 知识库核查）；新增或修改纯函数时补充单测。
- 修改 `scripts/` 后必须：在主工程执行 `npm run g` 全量验证。
- 涉及知识库时：`python3 docs/knowledge/tools/verify.py` 硬事实核查。
- 按需：`npm run s` 预览，检查受影响页面类型。
- 完成条件：应执行的命令全部通过；首页、文章页、Wiki 页等受影响页面类型均检查通过。

### 4. 提交

- 提交前须通过第 3 步中应执行的验证。
- 使用 Conventional Commits，一次提交只含一个逻辑改动；类型与格式见 `AGENTS.md`「Git 规范」。
- 改动只提交在本仓库（stellar）；仅当用户明确要求时 push。
- 完成条件：提交符合规范且已通过应执行的验证；如用户要求，已推送且远端为最新。

### 5. 发版

- 由用户触发时执行：分析自上一 tag 起的 commit 确定版本号 → 在 `CHANGELOG.md` 写入对应非空章节（H2 版本号 + H3 分类）→ 向用户确认版本号与变更摘要 → `npm run release:dry -- <version>` 预演 → 正式发版。
- 详见 `docs/guides/release-process.md` 与 `AGENTS.md`「发版规范」。
- 完成条件：版本号与变更摘要已获用户确认；dry-run 通过后完成正式发版。
