---
title: 知识库严格门禁方案
date: 2026-08-26
status: 已实施
---

# 知识库严格门禁方案

## 1. 问题与目标

现有 `docs/knowledge/tools/verify.py` 同时承担链接、配置字段、行号与版本扫描，但长期保留未分类警告，实际只阻断已经不再使用的行号引用和少量版本偏差。脚本还声明了未接通的标识符搜索能力，测试仅覆盖版本正则，并因 Python 模块导入持续产生 `__pycache__`。

目标是保留知识库机械事实检查，同时建立可判定、零噪音的完成条件：仓库内 Markdown 链接、公开主题配置引用和当前版本引用必须全部有效；语义正确性继续由最终 diff 人工核验，不由启发式脚本冒充。

成功标准：

- `npm run knowledge:check` 是唯一稳定入口，CI 与协作文档不引用实现文件路径；
- 所有未分类发现都使命令失败，不保留“既有非阻断噪音”；
- 配置字段读取生成的 Schema Reference，历史退出字段读取配置审计，不再解析 `_config.yml`；
- 核查过程不写工作区文件，不依赖 Python 或 ripgrep。

## 2. 技术方案

- 新增零依赖 Node.js 核查器 `ci/check-knowledge.js`，由 `package.json` 暴露 `knowledge:check`。
- 扫描 `docs/knowledge/**/*.md` 中代码围栏之外的仓库内 Markdown 链接，验证目标文件与 Markdown 标题锚点；外部 URL 跳过，逃逸仓库的路径失败。
- 扫描代码围栏之外、反引号内的点号字段。只把 Theme Scope 的顶层根视为候选，合法集合来自 `reference/v2-config.json` 的 `path/runtimePath`；已经退出的字段来自配置审计。`site.posts` 是 Hexo 运行时集合，不属于主题配置，作为明确的宿主对象例外。
- 扫描非历史知识库页面中的 `version:` 主题版本引用，与 `package.json` 对齐。
- 默认只输出终端摘要；`--json` 输出机器可读结果到 stdout，不生成报告文件。
- 保持 `ci/check-spec-refs.js` 与知识库门禁分离：前者验证 agent 规范权威与指针，后者验证领域知识库硬事实。

## 3. 影响范围

- 影响主题仓库的 CI、测试、协作规范与知识库维护命令，不改变主题运行时、渲染结果、公开配置或 npm 包行为。
- 清理当前门禁发现的失效链接和过时配置引用，并在 `docs/knowledge/VERIFICATION.md` 登记事实修正。
- 不需要同步主仓库公开 Wiki，也不需要运行 Hexo 构建。

## 4. 验证方式

- 单元测试覆盖有效/失效链接、标题锚点、当前/退出/非法配置字段、代码围栏、版本匹配及失败集合。
- 运行 `npm run knowledge:check`，确认当前知识库零发现。
- 运行 `npm test` 与 `npm run check`，验证新入口、agent 规范指针、Schema/Reference 与全仓门禁一致。
- 运行 `git diff --check` 并复核最终 diff，确认没有修改主题运行时。
