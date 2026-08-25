---
title: v2 空配置与最小内容默认体验
date: 2026-08-25
status: 已通过
---

# v2 空配置与最小内容默认体验方案

## 1. 问题与目标

本切片对应主题 issue #721 与 Pre-alpha M9。新站应直接依赖 Schema 默认值构建，不要求先创建或理解 `_config.stellar.yml`；普通 Post/Page 只使用 Hexo Front Matter，Collection 成员在已有注册数据、成员关系或约定源路径能够唯一确定时不重复声明 `collection.profile/id`。

验收结果：缺失或空主题覆盖均通过 doctor/build；Wiki、Topic、Notebook 的唯一、零、多重与显式冲突归属都有来源化诊断；最小内容的标题、摘要、封面、作者、日期、标签、导航、SEO、许可、评论与 Extension 投影稳定；Blueprint 与 Visual Style 不输出等同 Schema 默认值的字段；默认 Markdown 覆盖常用语法且没有 Stellar 专属 Front Matter。

## 2. 技术方案

### 2.1 可复用入口

- 继续以 `scripts/lib/config-schema.js` 的默认值、`scripts/lib/collection-pipeline/` 的单遍发现和 `scripts/lib/models/index.js` 的 ViewModel 降级为唯一事实来源。
- 新增纯函数 `scripts/lib/content-membership.js`，同时供 build 与 doctor 使用；不在 adapter、模型或 CLI 中复制推断规则。
- 复用 `navigation.tree`、Topic `route.start`、`source/wiki/<id>/`、`source/notebooks/<id>/` 与 `source/_posts/topic(s)/<id>/` 这些已有注册数据、成员关系和明确命名空间。普通 `_posts` 与普通 Page 没有 Collection 意图时保持 Post/Page。
- Blueprint 最小性由组合后的 `_config.stellar.yml` 与 Schema 默认结果比较；删除任一叶子而输出不变即视为冗余并在构建计划阶段拒绝。

### 2.2 归属矩阵

- 显式 `collection.profile/id` 指向已注册且内容类型匹配的 Collection 时有效；如 route/tree 成员关系或 Notebook/Topic 强命名空间唯一指向另一 Collection，则报冲突。Wiki 物理目录允许作为历史别名，由合法显式 id 消歧。
- 无显式声明且候选唯一时，Pipeline 只在内存中的冻结配置投影补入归属，不修改 Markdown。
- 候选为零且来源位于明确 Collection 命名空间时拒绝；普通 Post/Page 候选为零时按普通内容处理。
- 候选多于一个时拒绝猜测。doctor/build 统一给出源文件、候选 `profile:id` 和最小修复：补充 `collection.profile/id`、创建对应 Collection 数据或移动源文件。

### 2.3 默认内容与 Blueprint

- doctor 将 `_config.stellar.yml` 视为可选覆盖：缺失时校验 Schema 默认配置，空文件等价于空对象。
- 三套 Blueprint 只保留身份、导航、版式等相对默认值确有差异的字段；默认 `stellar` Visual Style 是空覆盖，`minimal` 只保留差异值。
- Docs Reference 的 Wiki starter 由目录和 tree 推断；Topic 集成 fixture 由 `route.start` 推断；Notebook 继续由同名目录推断。
- Classic Blog starter 只保留 Hexo 的 `title/date`，正文覆盖标题、段落、列表、引用、代码、图片、链接与表格；无 description、tags 或 Stellar 字段时仍产生确定性 ViewModel、SEO 与 Runtime Manifest。

## 3. 影响范围

- 代码：`scripts/lib/content-membership.js`、Collection Pipeline、doctor、Blueprint loader/minimality gate、Alpha 集成 fixture。
- 资产：三套 Blueprint 配置、两套 Visual Style 与 starter Markdown。
- 测试：归属矩阵、空/缺失配置、默认内容降级、Blueprint 冗余字段和真实 tarball 构建。
- 文档：内容组织、内容 Schema、Wiki/Topic/Notebook、Blueprint/CLI、总览与 `VERIFICATION.md`。
- 新公开配置、URL、DOM、CSS、语言文案、浏览器公共 API、依赖、迁移/SEO 跳转、npm 发布与 tag 均为 N/A；M10 与 Alpha 1 保持未完成。

## 4. 验证方式

- Node.js 22 下 `npm run check`，包含纯函数、doctor、Blueprint 与默认 ViewModel/Runtime 测试。
- `npm run alpha:check`：三套 Blueprint tarball，加一套不运行 init、无 `_config.stellar.yml` 的默认站点。
- 主工程 `npm run g`，检查首页、普通文章、普通 Page、Wiki、Topic、Notebook 与 Runtime Manifest。
- `npm run reference:check`、知识库硬事实核查、首屏性能门禁与 Standards / Spec 最终自审。
