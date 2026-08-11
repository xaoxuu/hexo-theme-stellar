---
name: stellar-theme-dev
description: 主题仓库开发全流程：方案（docs/designs）、代码开发（layout/、scripts/、source/、languages/）、全量验证（npm run check、主工程 npm run g）、知识库核查（docs/knowledge）、Conventional Commits 提交与主题发版（CHANGELOG + npm run release）。当任务涉及本仓库（hexo-theme-stellar）任何主题文件、主题构建验证、知识库更新或主题发版时使用。
---

# Stellar Theme Dev

主题仓库（hexo-theme-stellar）开发全流程。开始前先读仓库根 `AGENTS.md`（唯一权威完整规范）；`CLAUDE.md` 与 `.github/copilot-instructions.md` 为兼容入口；涉及主题代码、配置或行为问题时，先查 `docs/knowledge/` 对应领域，再读源码确认。

## 流程

### 1. 方案

- 多步骤或功能改动在 `docs/designs/{YYYY-MM-DD}-{功能简称}/` 下建方案文档（模板 `docs/designs/_template/`，含 `spec.md` / `plan.md` / `checklist.md`）。
- 方案需写明：要解决的问题、技术方案与实现思路、影响范围、需同步的知识库页面与文档。
- 完成条件：改动范围与受影响维度已确认，方案文档已就位。

### 2. 开发

- 新增功能覆盖维度：`layout/` + `scripts/` + `source/css/` + `source/js/`（如需）+ `languages/`（如需）+ `docs/`。
- 新增或重构标签插件先读 `docs/guides/tag-plugins-style-guide.md`；代码遵循 `AGENTS.md` 的 EJS / Node / Stylus / 浏览器 JS 规范。
- 完成条件：改动文件清单覆盖全部相关维度，与知识库和源码一致。

### 3. 验证

- 静态检查与测试：`npm run check`（lint + 单测 + 知识库核查）；新增或修改纯函数时补充单测。
- 全量验证（修改 `scripts/` 后必须）：在主工程执行 `npm run g`（已含 `hexo generate` + gulp minify）。
- 知识库硬事实核查：`python3 docs/knowledge/tools/verify.py`（涉及知识库时）。
- 预览：`npm run s` 按需渲染，检查受影响页面类型。
- 完成条件：以上命令全部通过；首页、文章页、Wiki 页等受影响页面类型均检查通过。

### 4. 提交

- 使用 Conventional Commits：`feat` / `fix` / `refactor` / `perf` / `style` / `docs`，一次提交只含一个逻辑改动。
- 只有用户明确要求「推送」时才 push。
- 完成条件：提交记录符合规范；如用户要求，已推送且远端为最新。

### 5. 发版

- 由用户触发时执行：分析自上一 tag 起的 commit 确定版本号 → 在 `CHANGELOG.md` 写入对应非空章节（H2 版本号 + H3 分类）→ 向用户确认版本号与变更摘要 → `npm run release:dry -- <version>` 预演 → `npm run release`。
- 详见 `docs/guides/release-process.md` 与 `AGENTS.md`「发版规范」。
- 完成条件：版本号与变更摘要经用户确认，dry-run 通过后执行正式发版。

## 护栏

- 修改 `scripts/` 后未通过主工程 `npm run g` 全量验证不得提交。
- 未经用户确认版本号与变更摘要，不得执行发版。
- 主题源码的唯一提交目标是本仓库（stellar）；本仓库以 git submodule / npm 包形式被使用方引用，跨仓库协作步骤以使用方主仓库规范为准。
