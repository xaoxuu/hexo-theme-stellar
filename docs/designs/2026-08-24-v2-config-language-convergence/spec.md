---
title: Stellar v2 M6 配置、语言与内部常量收敛
date: 2026-08-24
status: 实施中
issue: 724
---

# Stellar v2 M6 配置、语言与内部常量收敛

## 问题

M5 候选基线已经拥有封闭的声明式配置 Schema、Reference、Blueprint、doctor 与浏览器 Runtime Manifest，但公开配置仍混入三类不应由站点用户承担的事实：

1. 复制、代码复制、AI 摘要和 OKR 默认状态的主题系统文案仍以中文或英文写在 Schema 与 `_config.yml`；
2. 只有一个内置实现的 Feature provider 仍作为无意义的公开选项；
3. request/cache 的容量、TTL、超时、重试和交互时序仍以公开配置或分散常量存在。

这会让 Reference 暗示并不存在的产品选择，使非中文站点得到中文默认文案，也让高级 DIY 用户难以找到固定策略的唯一实现入口。

## 用户结果

- 公开 Reference 只展示站点用户真正需要选择的配置；
- 主题 UI、状态与提示随 Hexo `language` 使用 `languages/*.yml`；
- 品牌、菜单、Footer、许可文本和用户显式提供的 Extension 文案仍归站点配置所有；
- 内置资源、provider 身份、缓存策略与固定时序从一个内部常量模块投影到运行时，不形成新的公开配置根；
- Pre-alpha 被收回的字段直接按未知/已内部化字段拒绝，不提供别名、兼容读取或静默 fallback。

## 字段决策模型

Theme、Collection 与 Front Matter 的当前 Schema 字段由 `scripts/lib/config-field-audit.js` 逐项生成唯一结论：

| 结论 | 含义 |
| --- | --- |
| `public` | 用户需要显式选择或可合理自定义，继续进入 Schema/Reference |
| `localize` | 主题提供的系统文案由语言文件拥有，不作为公开默认文本 |
| `derive` | 从 Hexo、Collection、Front Matter 上游或注册上下文确定，不要求重复配置 |
| `internalize` | 内置资源、唯一 provider、缓存/请求策略或固定时序只由主题内部拥有 |
| `remove` | 已无产品语义且不应继续读取的 Pre-alpha 字段 |

生成审计同时包含从公开 Schema 退出的 M6 字段，因此不存在“从 Reference 消失即未审计”的空洞。审计结果必须与配置 Reference 稳定生成，并由测试校验每个字段恰有一个结论和非空理由。

## 配置变更

### 本地化默认文案

- `{% copy %}` 的成功提示只读取 `message.copied`；`extensions.tags.copy` 退出公开 Schema。
- code-copy 只保留 `enabled`；idle、success、拒绝授权、不支持环境与 toast 文案从 Runtime Manifest 的页面语言投影取得。
- AI 摘要 `interface.name/introduce/buttons` 保留显式站点覆盖能力，但 Schema 默认改为 `null`/空数组，运行时仅在缺失时使用语言文件；`interface.version` 是 provider 固定事实，内部化。
- OKR 内置五种状态只保留可配置颜色；默认 label 从语言文件取得。动态自定义状态仍允许显式 `label`。

### 内部化配置

- `extensions.features.preload/lightbox/reveal/ai_summary/diagrams.provider` 退出公开 Schema；实现身份来自内部常量。
- `extensions.cache` 退出公开 Schema；缓存开关、默认/服务 TTL、最大条目数、单条大小、请求重试/超时与 idle 调度策略进入内部常量。
- `extensions.tags.copy` 退出公开 Schema；标签能力本身继续存在，不再暴露空配置节点。

## 内部常量接缝

新增 `scripts/lib/internal-constants.js` 作为本切片内部事实入口，包含：

- Extension 资源 URL 与本地模块路径；
- 唯一 provider 身份；
- request/cache 策略；
- reveal watchdog、code-copy feedback/toast 等固定时序。

服务端通过 `extension_assets()` 与 Runtime Manifest 投影常量；浏览器模块只消费冻结 manifest，不再携带另一套默认值。该 manifest 字段属于主题内部协议，不进入 `_config.stellar.yml`、Collection 或 Front Matter。

## 影响范围

- 配置：`_config.yml`、`scripts/schema/config-schema.js`、`scripts/schema/config-target.js`
- 内部运行时：`scripts/lib/internal-constants.js`、`scripts/lib/extension-assets.js`、`scripts/lib/browser-runtime.js`、`source/js/runtime/`
- 标签与模板：`scripts/tags/lib/copy.js`、`scripts/tags/lib/okr.js`、`layout/_partial/scripts/runtime.ejs`
- 语言：`languages/en.yml`、`languages/zh-CN.yml`、`languages/zh-TW.yml`
- Reference/doctor/Blueprint：继续消费同一精简 Schema，不另建兼容层
- 文档：配置系统、本地化、浏览器运行时、`VERIFICATION.md`

## 不变边界

- 不改变公开 URL、DOM 结构、CSS、视觉结果或客户端公共 API；
- 不改品牌、菜单、Footer、许可和用户自定义标签内容的配置所有权；
- 不发布 npm、不创建 tag、不更新主仓库子模块指针；
- M7 的 Collection Pipeline、M8 的统一 Extension 描述契约与 M9 的空配置体验不提前实施。

## 验收标准

1. 当前与退出 Schema 的全部字段均有唯一结论、理由、默认来源和消费方；
2. 三套语言结构一致，复制、code-copy、AI 摘要和 OKR 默认状态无硬编码中文/英文默认；
3. 被内部化字段在 `_config.stellar.yml` 中结构化失败，Reference 与 Blueprint 不再输出；
4. Runtime Manifest 深度冻结并显式包含内部 policy 与页面语言 message 投影；
5. Reference/doctor/Blueprint 测试、`npm run check` 与主工程 `npm run g` 通过；
6. Standards / Spec 双轨 review 无剩余 finding，主题提交到达 `origin/v2` 后闭环 #724。
