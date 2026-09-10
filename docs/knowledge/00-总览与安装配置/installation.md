---
title: 安装与启动
domain: 总览与安装配置
tags:
  - 安装
  - npm
  - 环境要求
---

# 安装与启动

<details>
<summary>相关源码文件</summary>

- [README.md](../../../README.md)
- [_config.yml](../../../_config.yml)
- [package.json](../../../package.json)
- [scripts/commands/stellar.js](../../../scripts/commands/stellar.js)
- [scripts/events/lib/config-hot-reload.js](../../../scripts/events/lib/config-hot-reload.js)

</details>

本文记录当前 v2 文件树的安装、依赖、启用和版本边界。面向普通用户的步骤见公开 Wiki 的[环境与安装](https://xaoxuu.com/wiki/stellar/start/install/)。

## 环境要求

| 组件 | 要求 | 来源 |
| --- | --- | --- |
| Node.js | >= 22 | `package.json#engines` |
| Hexo | >= 8 | 主题运行时和 Doctor |
| hexo-cli | 4.3.0 至当前版本 | README |
| npm | 随受支持的 Node.js 安装 | 依赖安装与脚本入口 |

运行中的实际版本以博客目录内的命令为准：

```sh
node --version
npx hexo version
```

## 安装来源与版本边界

公开安装页提供四条边界明确的路径：

- **从蓝图安装**：由 Stellar Examples 创建已配置站点，并按 Blueprint catalog 锁定主题依赖；蓝图只创建新站点，不覆盖或自动升级已有目录。
- **稳定版**：安装 npm 已公开的版本。
- **最新版**：把官方仓库 `main` 作为 submodule；可以获得尚未发布到 npm 的当前源码。
- **DIY**：先 Fork 官方仓库，再把自己的 Fork 作为 submodule；用户负责合并上游更新与解决冲突。

蓝图创建器的最短入口为：

```sh
curl -fsSL https://github.com/xaoxuu/hexo-theme-stellar-examples/raw/main/install.sh | sh -s -- create my-site --blueprint=lightblog --non-interactive
```

合并完成后，仓库 `main` 是 v2 当前源码。官方 submodule 安装需要同时取得主题文件和主题自身的依赖：

```sh
git submodule add -b main https://github.com/xaoxuu/hexo-theme-stellar.git themes/stellar
npm install --prefix themes/stellar
```

npm 安装只代表 registry 已公开的版本，不等于仓库当前源码：

```sh
npm install hexo-theme-stellar
npm ls hexo-theme-stellar
```

`2.0.0-rc.3` 使用 npm 的 `rc` dist-tag；不带版本的安装命令仍读取 `latest`，因此在 v2 稳定版发布前会得到 1.x。体验候选版时使用 `npm install hexo-theme-stellar@rc`，锁定部署或复现问题时使用 `npm install hexo-theme-stellar@2.0.0-rc.3`。公开 v2 Wiki 不应被当作 1.x 配置参考；升级时以实际安装版本、Release、[CHANGELOG](../../../CHANGELOG.md)和迁移说明为准。同一个站点不要同时保留 `themes/stellar` 源码和 npm 主题包。

源码更新后要重新安装依赖：

```sh
git -C themes/stellar pull --ff-only origin main
npm install --prefix themes/stellar
```

DIY 使用相同的依赖安装与更新步骤，但 submodule URL 指向用户自己的 Fork；不能把 Fork 与官方 submodule 当作两个并存安装源。

## 启用与检查

在博客根目录的 `_config.yml` 中启用主题：

```yaml
theme: stellar
```

随后执行：

```sh
npx hexo stellar doctor
npx hexo generate
```

`doctor` 是只读检查，覆盖 Node.js、Hexo、主题选择、主题 Schema、Collection YAML、Markdown Front Matter 和内容归属，不会修改文件。机器消费使用：

```sh
npx hexo stellar doctor --format json --silent
```

`--silent` 是 Hexo 全局选项，用于避免启动日志混入 JSON stdout。Stellar 命令只提供 `doctor` 和 `new note`；预览站点使用 Hexo 自己的 `npx hexo server`。

完整 Blueprint 由 [Stellar Examples](https://github.com/xaoxuu/hexo-theme-stellar-examples) 独立维护。它们不是运行 v2 的前置条件；普通 Post/Page 站点可以不创建 `_config.stellar.yml`，直接使用 Schema 默认值。

## 安装位置与配置来源

Hexo 可以从两种位置加载主题：

```text
your-hexo-site/
├── _config.yml
├── _config.stellar.yml        # 可选的站点主题覆盖
├── themes/stellar/            # 源码／子模块安装
└── node_modules/
    └── hexo-theme-stellar/    # npm 安装
```

主题包内的 `_config.yml` 由 Schema 生成，列出完整默认值。站点只在根目录 `_config.stellar.yml` 写需要覆盖的字段；缺失文件与空文件都表示全部使用默认值。

当前主题配置根为：

```text
topbar, leftbar, rightbar, footer, profiles,
article, appearance,
search, comments, tags, features, services,
preconnect, fallbacks,
canonical, open_graph, structured_data, inject
```

配置经过严格 Schema 校验后形成冻结的运行时对象。未知字段、错误类型和非法枚举会在构建早期报错；数组整体替换，对象按声明字段递归合并，允许 `null` 的字段才可以用它表达继承或关闭。

## 主题依赖

`package.json` 是依赖唯一事实源：

| 依赖 | 当前范围 | 用途 |
| --- | --- | --- |
| `cheerio` | ^1.1.0 | 构建期 HTML 处理 |
| `hexo-renderer-ejs` | ^2.0.0 | EJS 模板渲染 |
| `hexo-renderer-stylus` | ^3.0.1 | Stylus 编译 |
| `hexo-pagination` | ^3.0.0 | 列表分页 |
| `js-yaml` | ^4.1.0 | Doctor 读取 YAML |
| `probe-image-size` | ^7.2.3 | 图片尺寸探测 |
| `sharp` | ^0.34.5 | 图片解码与平均色提取 |
| `hexo-front-matter` | ^4.2.1 | 源码 Front Matter 解析 |

`glob` 属于开发依赖，仅用于主题仓库的源码复用检查，不随用户安装主题引入。

浏览器端 `source/js/runtime/` 以原生 ESM 分发。消费站点的转译或压缩流程必须保留该目录的模块语义和相对 import，不能把它当作传统脚本转成 CommonJS。

## 版本管理

`package.json` 是主题版本唯一所有者，`package-lock.json` 与安装知识库由发布流程同步。当前候选版本为 `2.0.0-rc.3`；所有公开版本使用相同的 npm 安装与 Release 流程。

主题只在 npm `latest` 按 SemVer 严格新于本地版本时提示升级。内部 v2 候选高于公开 v1 时不会提示用户反向安装 1.x；无法解析版本号时静默跳过。

## 常见问题

| 现象 | 检查与处理 |
| --- | --- |
| 找不到主题或渲染器 | 确认安装来源；源码安装执行 `npm install --prefix themes/stellar`，npm 安装检查站点锁文件 |
| `Usage: hexo <command>` 且没有 `server` | 站点安装 `hexo-server`，再运行 `npx hexo server --ip 127.0.0.1` |
| `Usage: hexo stellar <doctor|new note>` | 使用了不存在的 Stellar 子命令；预览和生成属于 Hexo |
| 页面仍是默认主题 | 检查博客 `_config.yml` 是否为 `theme: stellar` |
| 修改 `_config.stellar.yml` 后失败 | 开发服务器会保留上一次有效配置并警告；按 Schema 错误修正后重新生成 |
| v2 配置被判未知字段 | 先确认实际安装版本；npm 仍为 1.x 时不能使用 v2 配置 |

## 维护边界

- 安装命令、环境要求和版本边界变化时同步 README、公开 Wiki 与本页。
- 依赖清单只从 `package.json`核对，不在其它文档维护第二份权威列表。
- 发版准备按最近公开 tag 到候选树的净变化更新 CHANGELOG、迁移说明和版本级 [VERIFICATION](../VERIFICATION.md)。
- 修改知识库后运行 `npm run knowledge:check`；发布候选运行 `npm run release:check`。
