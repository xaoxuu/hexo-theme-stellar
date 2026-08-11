# Stellar 主题中文知识库

> 为 Stellar 主题（hexo-theme-stellar）贡献者与 AI 编码工具提供的中文参考资料。

## 目录结构

- `00-总览与安装配置/` ~ `09-高级主题/`——按主题域组织的中文知识库
- `_glossary.md`——术语对照表
- `VERIFICATION.md`——核查与修正记录
- `tools/verify.py`——硬事实核查脚本（用法：`python3 tools/verify.py`）
- `知识库全量.md`——合并版（RAG / 一次性上下文导入）

## 使用方式

- **按域浏览**：从下方领域入口进入，每个领域有 `index.md` 页面索引
- **作为 AI 背景资料**：涉及主题代码、配置或行为问题时，先查阅对应领域再读源码确认
- **全量导入**：RAG 或一次性上下文可用合并版 `知识库全量.md`

## 领域入口

| 领域 | 入口 | 覆盖内容 |
|------|------|----------|
| 总览与安装配置 | [index.md](00-总览与安装配置/index.md) | 架构、安装、配置系统 |
| 样式系统 | [index.md](01-样式系统/index.md) | 设计令牌、排版、颜色、响应式、混入、代码高亮 |
| 布局系统 | [index.md](02-布局系统/index.md) | 根布局、模板路由、侧边栏、Logo/导航、SEO |
| 内容系统 | [index.md](03-内容系统/index.md) | 文章、wiki、笔记本、错误页、相关内容 |
| 标签插件 | [index.md](04-标签插件/index.md) | 图标、容器、媒体、交互、社交卡片 |
| 前端交互 | [index.md](05-前端交互/index.md) | 初始化、TOC、canonical、标签页与工具 |
| 数据服务与组件 | [index.md](06-数据服务与组件/index.md) | 数据服务 API、小部件架构 |
| 外部集成 | [index.md](07-外部集成/index.md) | 评论、搜索、懒加载、预加载、插件系统 |
| 本地化 | [index.md](08-本地化/index.md) | i18n 语言文件与翻译键 |
| 高级主题 | [index.md](09-高级主题/index.md) | 自定义样式、自定义标签插件、性能优化 |

## 维护约定

- 知识库与代码不一致时**以代码为准**，修正后登记到 `VERIFICATION.md`
- 主题升级或行为变更后，运行 `python3 tools/verify.py` 复查硬事实
- 页面内文件路径均已对照 `themes/stellar/` 核实；旧文档行号引用已移除（行号易过期）
- 已移除功能（如 PJAX、jQuery、`welcome` 组件、`npm-publish.sh`）在对应页面已改写为当前实现
- 每个页面 front matter 含 `title`、`domain`、`tags` 元数据，便于检索与引用
