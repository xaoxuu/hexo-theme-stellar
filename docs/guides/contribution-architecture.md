# 贡献架构与维护面

Stellar v2 遵循“一项语义事实、一个权威所有者”。贡献者仍需同步实现、测试和文档，但不应在多个白名单重复登记同一 ID、资源或默认值。

## 七类贡献的权威所有者

| 贡献类型 | 权威所有者 | 合理维护面 | 必需测试接缝 | 常见失败 |
| --- | --- | --- | --- | --- |
| 公开配置 | `scripts/schema/config-schema.js` | `config-target.js`、`_config.yml` 可发现示例、Reference、配置知识库 | Schema 正/反例、`npm run reference:check` | 在消费方另写 fallback，或只改 YAML 没改 Schema |
| 内容 profile | `scripts/lib/collection-pipeline/registry.js` adapter | Collection/Front Matter Schema、索引与 ViewModel、CLI（如果创建内容） | Pipeline 行为矩阵、路由/ViewModel 契约、真实 generate | 新增第二个 `before_generate` 入口，或重扫全量内容 |
| 服务端功能 | 对应 `scripts/lib/` 纯模型 | helper/filter/event 薄适配器、错误来源、知识库 | 纯函数单测、Hexo 注册/消费测试、主工程 generate | 把业务默认值写进 EJS 或 event 回调 |
| UI 组件 | `layout/_partial/components/` 或 `layout/_partial/widgets/` | `_data/widgets.yml`、Stylus、必要的浏览器增强、组件知识库 | 模板输出契约；有状态时加 mount/unmount 测试 | 为一个页面复制组件 DOM/CSS，或忽略移动端/右栏上下文 |
| 浏览器 Extension / Feature | `scripts/lib/contribution-registry.js` descriptor | ESM adapter、`internal-constants.js` asset 真值、可选 Schema/i18n、Extension 知识库 | Manifest 投影、mount/unmount/失败隔离、`npm run contributions:check` | 手工修改 Manifest ID 白名单，或添加 asset 却未登记所有者 |
| 标签插件 | `scripts/tags/index.js` 与 `scripts/tags/lib/<id>.js` | `extensions.tags/services` Schema（如需）、tag Stylus、service Extension、语法文档 | 输入语法→安全 HTML 测试；远程数据增加失败降级测试 | 恢复 `tag_plugins/data_services` 旧根，或把可选远程失败当程序错误 |
| 语言文案 | `languages/en.yml`、`zh-CN.yml`、`zh-TW.yml` 同构键 | 消费方只使用 `__()`；descriptor 需声明的键登记在 `i18n` | 全量键对等测试、contribution 缺键负例 | 在 Node/EJS/浏览器中再写一份系统文案 fallback |

## Runtime 贡献 descriptor

Extension、Feature 和 Runtime 可注册组件均由 `scripts/lib/contribution-registry.js` 登记：

```js
{
  id: "card-hover",
  kind: "feature",
  entry: { type: "browser-module", path: "/js/runtime/extensions/card-hover.mjs" },
  resources: ["features.cardHover"],
  activation: { type: "selector", value: ".card-hover" },
  schema: "extensions.features.card_hover",
  i18n: null,
  docs: { category: "Components", path: "docs/knowledge/07-外部集成/plugin-system.md" },
  tests: ["test/card_hover_client.test.js", "test/browser-runtime-manifest.test.js"],
  defaultsOwner: "scripts/schema/config-schema.js#extensions.features.card_hover",
  project(context) { /* 从规范化页面上下文投影 config，不复制默认值 */ }
}
```

`resources` 登记 `internal-constants.js` assets 树的键路径，不复制 URL。`schema` 与 `defaultsOwner` 成对出现；纯内部组件两者均为 `null`。`project()` 只决定本页是否出现该声明以及如何投影已规范化配置，具体 DOM 行为属于 ESM adapter。

这是主题内部构建契约，不是第三方 manifest 或稳定公开 API。

## Card Hover 贡献演练

Card Hover 的迁移展示了一个简单浏览器 Feature 的最小维护面：

1. `source/js/plugins/card-hover.js` 保留可测的业务实现，`source/js/runtime/extensions/card-hover.mjs` 只做 asset load 与 mount/unmount 适配。
2. `internal-constants.js` 只所有 `features.cardHover.js` 的具体路径；descriptor 只登记该资源键。
3. descriptor 单点登记 `card-hover` ID、ESM 入口、`.card-hover` 激活、Schema、文档和行为测试；`config-target.js` 也从 descriptor 派生 Feature Schema ID，不再维护第二份列表。
4. `browser-runtime.js` 通用投影注册表；`feature.mjs` 不再增加 `card-hover` case，也不再有第二份 Manifest ID 列表。
5. `test/card_hover_client.test.js` 验证交互与清理，Manifest 测试验证投影，contribution 门禁验证所有维护面已连通。

新功能不得为了绕过 descriptor 而直接在 `browser-runtime.js` 插入条件分支。如果一个功能有独立生命周期，优先使用独立 ESM adapter；通用 `feature.mjs` 仅保留已有兼容 adapter。

## 执行门禁

```bash
npm run contributions:check
npm test
npm run reference:check
python3 docs/knowledge/tools/verify.py
```

`contributions:check` 检查重复注册/默认值所有者、缺失翻译、Schema/Reference 漂移、未登记资源、缺失入口/文档/行为测试。它检查维护面是否连通，不替代功能本身的正反例和真实 Hexo 构建。
