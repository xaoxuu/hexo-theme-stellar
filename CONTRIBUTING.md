# 贡献指南

感谢你考虑为 [Stellar](https://github.com/xaoxuu/hexo-theme-stellar) 贡献代码或文档。本指南只保留贡献者需要的入口；工程规则以 [AGENTS.md](AGENTS.md) 为准，主题使用方法见 [Wiki 文档](https://xaoxuu.com/wiki/stellar/)。

## 仓库边界

| 仓库 | 职责 |
| --- | --- |
| [hexo-theme-stellar](https://github.com/xaoxuu/hexo-theme-stellar) | 主题代码、默认配置、国际化、主题工程文档与版本发布 |
| [hexo-theme-stellar-examples](https://github.com/xaoxuu/hexo-theme-stellar-examples) | 官方博客与文档场景，用于需要宿主环境的集成验证 |

主题仓库不维护具体站点的内容、配置、版本引用或部署规则。只有任务需要宿主页面且仓库内证据不足时，才使用示例工程或任务指定的消费站点。

## 准备环境

公开兼容范围以 [README.md](README.md) 为准，当前开发命令以 [package.json](package.json) 为准，CI 使用的 Node.js 版本以 [.github/workflows/ci.yml](.github/workflows/ci.yml) 为准，避免在多处复制版本矩阵。

需要宿主环境时，推荐克隆官方示例工程，将主题副本放入 `blog/themes/stellar` 或 `docs/themes/stellar`，在对应示例目录安装依赖并构建。也可以把主题作为 submodule 挂载到自己的 Hexo 站点：

```bash
git submodule add https://github.com/<your-name>/hexo-theme-stellar.git themes/stellar
```

## 开发与验证

开始前阅读 [AGENTS.md](AGENTS.md)，确认任务边界和最低充分验证级别。常用专项指南：

- 新增或重构标签插件：[标签插件开发规范](docs/guides/tag-plugins-style-guide.md)
- 修改配置、内容 profile、组件、Extension 或语言文案：[贡献架构指南](docs/guides/contribution-architecture.md)

公开 v2 文档按[入门](https://xaoxuu.com/wiki/stellar/start/install/)、[配置参考](https://xaoxuu.com/wiki/stellar/reference/theme/)和[行为参考](https://xaoxuu.com/wiki/stellar/reference/behavior/)组织。维护使用方迁移说明时核对 [AI 迁移契约](https://xaoxuu.com/wiki/stellar/migration/ai/)；旧公开入口由文档仓库的映射表和消费站点跳转实现承接。

先运行最接近改动的检查；需要全仓证据时运行 `npm run check`。所有可用脚本及其当前组合以 `package.json` 为准。宿主构建、视觉检查和分发验收只在任务影响这些契约时补充。

机器契约与直接测试随实现更新；知识库、CHANGELOG 和版本级 `VERIFICATION.md` 在发版准备时按最终净变化集中同步。

跨域架构、迁移、兼容、发布计划或其它需要持久化的设计方案统一使用 GitHub issue，正文应包含问题、决策、影响范围和验收标准；具体约定见 [Issue tracker](docs/agents/issue-tracker.md)。仓库不接收单次设计方案或其本地归档。

## 提交 Pull Request

按 [PULL_REQUEST_TEMPLATE.md](.github/PULL_REQUEST_TEMPLATE.md) 描述：

- 解决的问题、行为变化和相关 issue；
- 受影响的公开契约或内部模块；
- 实际执行的验证及结果；
- 尚需人工确认的页面、兼容性或发布事项。

提交信息使用 Conventional Commits，具体允许格式以 `ci/check-commit-msg.js` 为准。CI 的当前作业与触发条件以 [.github/workflows/ci.yml](.github/workflows/ci.yml) 为准。

## 发版

发版由维护者或明确授权的贡献者执行。准备 CHANGELOG、确认版本并运行脚本的完整流程见 [发版流程](docs/guides/release-process.md)；普通贡献不要提前维护发布快照。

## 社区与支持

- [Issues](https://github.com/xaoxuu/hexo-theme-stellar/issues)：BUG 反馈与技术问题
- [Discussions](https://github.com/xaoxuu/hexo-theme-stellar/discussions)：社区讨论
- [探索号](https://xaoxuu.com/wiki/stellar/support/articles/)：文章收录
- [社区支持页面](https://xaoxuu.com/wiki/stellar/support/contributors/)：贡献者与交流渠道

提问时请说明现象、复现步骤、尝试过程与报错信息。

## 许可

本仓库基于 [MIT License](LICENSE) 开源。
