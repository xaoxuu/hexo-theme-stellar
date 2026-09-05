# 贡献架构与维护面

一项语义事实由一个所有者维护。本指南定位贡献的实现与证据；验证级别、测试保留位置和文档同步时机分别按 [AGENTS.md](../../AGENTS.md) 的“验证门禁”“测试保留门禁”和“文档”，不因进入本指南而升级检查范围。

## 贡献所有者与证据

按本次实际改动选择适用项；表中的证据不代表都要新增永久测试。

| 贡献类型 | 权威所有者 | 相关维护面 | 直接证据 |
| --- | --- | --- | --- |
| 公开配置 | `_config.yml` 与 `scripts/schema/config-rules.js` | 运行时 Schema、配置知识库 | 受影响字段的可发现性、解析与消费正反例 |
| 内容 profile | `scripts/lib/collection-pipeline/registry.js` adapter | Front Matter Schema、索引/ViewModel、需要时的 CLI | 受影响路由与模型；生成契约变化时检查 generate |
| 服务端功能 | 对应 `scripts/lib/` 纯模型 | helper/filter/event 适配器、错误来源、知识库 | 模型与 Hexo 消费接缝 |
| UI 组件 | `layout/_partial/components/` 或 `layout/_partial/widgets/` | Widget 数据、Stylus、浏览器增强、知识库 | 本次渲染与交互用任务级验收；共享生命周期等长期契约才保留仓库测试 |
| 浏览器 Extension / Feature | `scripts/lib/contribution-registry.js` descriptor | ESM adapter、内部资源、可选 Schema/i18n、知识库 | Manifest 投影、资源加载与生命周期/失败隔离接缝；具体视觉与交互用任务级验收 |
| 标签插件 | `scripts/tags/index.js` 与 `scripts/tags/lib/` | 配置 Schema、Stylus、service Extension、语法文档 | 输入与安全 HTML、远程失败降级；具体结构与样式用任务级验收 |
| 语言文案 | `languages/en.yml`、`zh-CN.yml`、`zh-TW.yml` 同构键 | `__()` 消费、descriptor 的 i18n 声明 | 键对等与缺键负例；实际文案用任务级检查 |

## Runtime descriptor

新增或修改 Runtime 贡献时，先读取 `scripts/lib/contribution-registry.js` 中同类声明及其消费者，沿用现有字段：

- ID、入口、激活条件与投影由 descriptor 单点登记；消费者读取注册表，不另增 ID 白名单或专用分派分支。
- `resources` 引用 `scripts/lib/internal-constants.js` 的 assets 键，资源 URL 只由 assets 所有者维护。
- `schema` 与 `defaultsOwner` 成对出现；纯内部组件两者均为 `null`。`project()` 投影已经规范化的页面配置，具体 DOM 行为归 ESM adapter。
- `tests` 引用覆盖该贡献的长期架构接缝证据，可以复用共享测试；不要求每个组件新建测试文件，也不登记临时视觉验收脚本。
- 浏览器产物与宿主后处理遵循 AGENTS.md“浏览器产物”契约。

descriptor 是内部构建契约，其当前结构从源码读取；不作为第三方稳定公开 API。

## 核查与记录

改变 descriptor、其资源或 Schema/i18n 关联时，运行 `npm run contributions:check` 检查维护面连通性。该检查不替代本次受影响行为的直接证据；其余验证按根门禁选择最低充分级别。

长期文档和发布快照按 AGENTS.md“文档”同步；获准持久化的设计、迁移或验收记录按 [Issue 操作约定](../agents/issue-tracker.md) 保存。
