# 标签插件设计规范

> 适用范围：`scripts/tags/`、`source/css/_components/tag-plugins/`、`source/js/services/`、`_config.yml`、`languages/`、`docs/`
>
> 目标：在梳理现有标签插件实现模式的基础上，为 Stellar 的标签插件新增、重构与审查提供统一规范。

## 1. 目标与适用范围

本规范面向 Stellar 主题仓库中的标签插件开发，覆盖以下场景：

- 新增块级标签、内联标签或阅读类标签
- 重构既有标签的模板结构、样式或前端联动
- 为标签补充配置项、国际化文案、远程数据能力或文档
- 审查标签实现是否符合仓库既有风格

本规范是长期维护文档，不是单次功能设计稿。涉及某个具体标签的行为变更时，仍需在 `docs/designs/` 记录单次方案。

## 2. 现有标签插件家族与模式

### 2.1 家族划分

当前标签插件主要分为 5 类：

| 家族 | 典型标签 | 主要特征 |
| --- | --- | --- |
| 容器类 | `tabs`、`box`、`about`、`folding`、`folders`、`grid`、`gallery`、`banner` | 通常带 `content`，内部可继续渲染 Markdown 或子标签 |
| 数据类 | `friends`、`albums`、`sites`、`ghcard`、`timeline`、`toc`、`chat`、`md` | 依赖站点配置、本地数据或远程接口，部分标签会联动前端服务 |
| 表达类 | `note`、`button`、`link`、`mark`、`emoji`、`hashtag`、`mbti`、`okr`、`rating`、`vote` | 以静态展示为主，强调 HTML 结构与样式表达 |
| 阅读类 | `reel`、`paper` | 单独放在 `scripts/tags/lib/read/` 与 `source/css/_components/tag-plugins/read/` |
| 内联类 | `u`、`emp`、`wavy`、`kbd`、`psw`、`blur`、`sup`、`sub` | 统一注册在 `scripts/tags/inline-labels.js`，通常不单独建 JS 服务文件 |

### 2.2 当前稳定模式

从现有实现看，标签插件已经形成了较稳定的同构关系：

- 注册入口集中在 `scripts/tags/index.js`；轻量内联标签单独放在 `scripts/tags/inline-labels.js`
- 标签实现文件优先落在 `scripts/tags/lib/<name>.js`
- 样式文件优先落在 `source/css/_components/tag-plugins/<name>.styl`
- 需要前端增强时再补充 `source/js/services/<name>.js`
- 展示配置优先放在 `_config.yml` 的 `tag_plugins.<name>`
- 远程数据相关配置优先放在 `_config.yml` 的 `data_services.<name>`
- 有新增展示文案时同步更新 `languages/`

### 2.3 命名与结构共性

- 标签名、实现文件名、样式文件名、配置键名应尽量同名，优先保持一一对应
- 块级标签的 DOM 根节点通常以 `.tag-plugin` 为基类，再叠加具体标签类，例如 `.tag-plugin.note`
- 彩色标签统一使用 `.colorful` 辅助类，不为单个标签发明新的彩色模式
- 需要前端补全的占位节点统一使用 `.data-service` 与 `ds-*` 类名，例如 `.data-service.ds-sites`
- 远程数据或运行时参数优先通过 `data-*` 属性从服务端传给前端，而不是在前端硬编码读取全局状态

## 3. 统一设计规则

### 3.1 注册与目录规则

新增或重构标签时，优先遵循以下目录约定：

1. 在 `scripts/tags/lib/` 新增实现文件
2. 在 `scripts/tags/index.js` 注册标签
3. 在 `source/css/_components/tag-plugins/` 新增或更新对应样式
4. 只有在静态 HTML 无法满足需求时，才新增 `source/js/services/` 中的前端逻辑
5. 需要配置项、国际化或文档时，分别同步更新 `_config.yml`、`languages/`、`docs/`

仅当标签属于纯文本修饰、结构极轻量且不需要独立样式命名时，才考虑放入 `scripts/tags/inline-labels.js`。

### 3.2 参数解析规则

- 优先使用 `ctx.args.map(args, optionKeys, valueKeys)` 解析位置参数与键值参数
- 优先使用 `ctx.args.joinTags()` 回写颜色、子类型等 HTML 属性
- 标签参数设计尽量保持“少而稳”，优先位置参数 + 少量命名参数，不设计过度灵活的 DSL
- 多分支能力优先通过少数关键参数区分，例如 `group`、`repo`、`api`，避免同一标签承担过多互斥职责
- 参数非法或缺失时要提供安全兜底；兜底应优先读取主题配置，而不是静态写死在实现文件里

### 3.3 HTML 结构规则

- 块级标签优先输出语义清晰、层次稳定的结构，方便样式与前端服务复用
- 根节点优先带 `.tag-plugin`，再叠加标签专属类名；不要跳过公共根类
- 标题、正文、媒体区、操作区等子结构命名应直观且可复用，例如 `.title`、`.body`、`.info`
- 内部存在 Markdown 正文时，优先在服务端渲染后再拼装，而不是把原始 Markdown 留给前端处理
- 结构应便于嵌套使用，新增标签不能假设自己只会出现在顶层正文里

### 3.4 样式规则

- 标签样式统一落在 `source/css/_components/tag-plugins/`
- 选择器优先限制在 `.md-text` 或标签根类作用域下，避免污染全局元素
- 优先复用主题变量、色板、圆角、阴影与现有 mixin，不重复定义近似能力
- 样式命名保持 `kebab-case`，不要引入仅服务单个标签的另类命名体系
- 视觉增强应以局部覆盖为主，避免影响非目标区域或其它标签
- 新增彩色能力时，优先接入现有 `color` 属性与 `.colorful` 体系

### 3.5 前端联动规则

只有符合以下条件时才新增前端服务：

- 需要请求远程接口
- 需要根据运行时数据二次渲染
- 需要复杂交互，且无法通过纯 CSS/服务端渲染完成

新增前端服务时需遵循：

- 服务端标签只输出稳定占位结构与 `data-*` 参数
- 前端脚本只负责补全内容或增强交互，不重复定义服务端已经确定的结构语义
- 类名统一使用 `ds-*` 识别服务实例
- 默认资源、API host 等公共信息优先走主题配置注入，不在服务脚本中散落常量

### 3.6 配置与国际化规则

- 纯展示行为、默认配色、边框开关等，优先放在 `tag_plugins.<name>`
- 远程接口、数据源、请求行为等，优先放在 `data_services.<name>`
- 涉及新增可见文案时，必须同步补齐 `languages/`，避免只在某个语言下可用
- 不要把具体站点的私有数据直接写入主题仓库；主题只定义接口与默认行为

### 3.7 兼容与复用规则

- 保持 Hexo 原生 + Gulp 后处理，不引入新构建系统
- 保持现有技术边界：服务端 CommonJS、样式 Stylus、浏览器端遵循既有 ES2015+ 风格
- 优先复用现有标签结构与样式能力，只有在复用会显著降低可读性时才新建独立实现
- 行为变更尽量通过配置开关、参数扩展或局部兼容实现，避免直接破坏既有语法

## 4. 例外与兼容策略

现有仓库中存在一些合理例外，新增标签时可参考，但不应把例外当作默认模式：

- `radio` 复用 `checkbox` 的实现与样式，说明“同构语义的小变体”可以共享底层代码
- `users` 是 `friends` 的别名注册，说明对外语法可以保留兼容入口，但内部应尽量收敛到同一实现
- `box` 复用了 `note` 的基础结构，说明同族组件可以建立在已有模式上，而不必完全复制一份
- `blockquote` 的样式文件名不是同名文件，`video` 走 `media.styl`，说明样式映射可以存在例外，但新增场景优先遵循同名映射
- `inline-labels.js` 直接注册多个轻量标签，说明极简内联标签不必强行拆成一文件一标签

处理例外时，应优先满足以下原则：

1. 保持兼容旧语法
2. 不扩大历史包袱
3. 对新实现仍给出清晰入口与文档说明
4. 让后续维护者能快速判断“这是刻意复用”还是“无意耦合”

## 5. 新增或重构检查清单

每次新增或重构标签插件，至少检查以下项目：

- 是否明确标签属于容器类、数据类、表达类、阅读类或内联类
- 是否在正确目录注册并命名，与现有文件保持同构关系
- 是否使用 `.tag-plugin` 根类、必要的专属类，以及稳定的子结构命名
- 是否优先采用 `ctx.args.map`、配置兜底与服务端渲染，而不是自定义解析规则
- 是否把样式限制在正文与组件作用域内，避免全局污染
- 是否只有在确有必要时才新增前端服务，并通过 `data-*` + `ds-*` 联动
- 是否补齐 `_config.yml`、`languages/`、`docs/` 等配套文件
- 是否在 `docs/designs/` 记录本次行为变化、影响范围与验收标准
- 是否在修改 `scripts/` 后于主工程执行 `npm run g` 全量验证

## 6. 标签对照表

下表用于帮助快速定位“某类标签通常应该长什么样”，不是强制要求一字不差照搬。

| 标签/家族 | 服务端实现 | 样式文件 | 前端服务 | 常见配置/说明 |
| --- | --- | --- | --- | --- |
| `note` / `box` | `scripts/tags/lib/note.js`、`scripts/tags/lib/box.js` | `tag-plugins/note.styl` | 无 | 展示类卡片，优先走 `tag_plugins.note` |
| `tabs` / `folding` / `folders` | `scripts/tags/lib/*.js` | `tag-plugins/tabs.styl`、`folding.styl`、`folders.styl` | 无 | 容器类，关注嵌套结构与 Markdown 渲染 |
| `friends` / `users` / `albums` / `sites` | `scripts/tags/lib/*.js` | `friends.styl`、`sites.styl` 等 | `source/js/services/sites.js` 等 | 数据类，常联动本地配置或远程接口 |
| `rating` / `vote` / `timeline` | `scripts/tags/lib/*.js` | `rating.styl`、`vote.styl`、`timeline.styl` | `source/js/services/rating.js` 等 | 运行时增强类，优先占位后补全 |
| `mbti` / `okr` / `mark` / `button` | `scripts/tags/lib/*.js` | 同名 `.styl` | 一般无 | 表达类，强调结构清晰与主题风格一致 |
| `reel` / `paper` | `scripts/tags/lib/read/*.js` | `tag-plugins/read/*.styl` | 无 | 阅读类，使用子目录组织 |
| `u` / `emp` / `kbd` / `sup` / `sub` | `scripts/tags/inline-labels.js` | `tag-plugins/inline-labels.styl` | 无 | 轻量内联标签，不单独建实现文件 |

## 7. 文档要求

标签插件相关文档按以下规则归档：

- 单次设计或重构方案放入 `docs/designs/`
- 长期维护的流程、规范与操作手册放入 `docs/guides/`
- 风格一致性审计、问题盘点与改进建议放入 `docs/audits/`

当某次标签变更涉及语法、配置项或行为变化时，文档中至少要说明：

- 问题与目标
- 标签接口或配置接口
- 影响范围
- 兼容策略
- 验收方式
