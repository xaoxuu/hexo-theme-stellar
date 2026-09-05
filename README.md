# Stellar - 每个人的独立博客

[简体中文](README.md) · [English](README_EN.md)

一个博客，也是一套可以长期生长的内容系统。

从一篇文章开始。以后想加项目文档、专栏或笔记，仍然在同一个站点里写。

![Stellar 的轻博客、经典博客、个人知识库和项目文档](https://xaoxuu.com/wiki/stellar/assets/screenshots/v2/stellar-four-sites.webp)

[创建第一个博客](https://xaoxuu.com/wiki/stellar/start/install/) · [蓝图与展示墙](https://xaoxuu.com/wiki/stellar/support/examples/) · [完整文档](https://xaoxuu.com/wiki/stellar/)

> Stellar v2 已进入 Beta 开发阶段，尚未发布。Beta 是开发里程碑，不代表 npm 版本；公开文档目前统一说明 v2。

[![npm](https://img.shields.io/npm/v/hexo-theme-stellar)](https://www.npmjs.com/package/hexo-theme-stellar)
[![license](https://img.shields.io/github/license/xaoxuu/hexo-theme-stellar)](https://github.com/xaoxuu/hexo-theme-stellar/blob/main/LICENSE)
[![stars](https://img.shields.io/github/stars/xaoxuu/hexo-theme-stellar)](https://github.com/xaoxuu/hexo-theme-stellar)
[![npm downloads](https://img.shields.io/npm/dm/hexo-theme-stellar)](https://www.npmjs.com/package/hexo-theme-stellar)
[![release](https://img.shields.io/github/v/release/xaoxuu/hexo-theme-stellar)](https://github.com/xaoxuu/hexo-theme-stellar/releases)

## 内容多起来，也不用推倒重来

普通文章照常发布。项目需要一套稳定目录时，用 Wiki；几篇文章写成了系列，收进专栏；零散知识想长期补充，放进笔记本。

博客、Wiki、专栏和笔记本共享同一套导航、搜索、侧栏与阅读体验。只写博客时，其它系统不会跑出来打扰你。

## 静态博客，也能放一些活的内容

动态时间线、自动友链、远程 README、GitHub 仓库与贡献者、评分和投票都可以按需接入。博客仍然是静态文件，但经常变化的内容不必每次都跟着整站重新部署。

远程服务不会挡住正文先显示。接口暂时不可用时，文章仍然可以读。

## 写作、检索和阅读是一件事

提示框、折叠、标签页、图库、时间线、聊天和表格等内容组件可以互相组合。Markdown 表达不够时，不需要临时拼一套风格各异的插件。

本地搜索由主题生成索引，结果可以直接落到文章章节；桌面端目录和信息栏到了手机上会变成抽屉，把位置让给正文。

[内容组件](https://xaoxuu.com/wiki/stellar/reference/tags/) · [站内搜索](https://xaoxuu.com/wiki/stellar/guides/search/) · [外观与排版](https://xaoxuu.com/wiki/stellar/guides/appearance/)

> 如果你只想写博客，它不会逼你理解这些系统；内容真的多起来时，它们已经在那里了。

## 选择一个起点

| 示例 | 适合什么样的站点 | 在线预览 |
| --- | --- | --- |
| 留白 · Light Blog | 安静写长文、随笔和生活记录 | [打开](https://xaoxuu.github.io/hexo-theme-stellar-examples/lightblog/) |
| 星迹 · Blog | 使用经典侧栏整理文章、分类与专栏 | [打开](https://xaoxuu.github.io/hexo-theme-stellar-examples/blog/) |
| 个人知识库 · Knowledge | 把博客、项目资料和长期主题放在一起 | [打开](https://xaoxuu.github.io/hexo-theme-stellar-examples/knowledge/) |
| 项目文档 · Docs | 给一个项目维护清晰的文档目录 | [打开](https://xaoxuu.github.io/hexo-theme-stellar-examples/docs/) |

示例源码在 [hexo-theme-stellar-examples](https://github.com/xaoxuu/hexo-theme-stellar-examples/)。

## 快速开始

### 环境要求

```yaml
Hexo: '>= 8'
hexo-cli: 4.3.0 ~ latest
node: '>= 22'
npm: '>= 10'
```

### 体验 v2 Beta

在博客根目录添加主题源码并安装依赖：

```bash
git submodule add https://github.com/xaoxuu/hexo-theme-stellar.git themes/stellar
npm install --prefix themes/stellar
```

然后在博客 `_config.yml` 中启用主题：

```yaml
theme: stellar
```

运行 Doctor 和生成：

```bash
npx hexo stellar doctor
npx hexo generate
```

完整步骤见[环境与安装](https://xaoxuu.com/wiki/stellar/start/install/)和[创建第一个站点](https://xaoxuu.com/wiki/stellar/start/first-site/)。

### 使用 npm 公开稳定版

```bash
npm install hexo-theme-stellar
```

这条命令不保证安装到 v2。复制 v2 配置前，请先运行 `npm ls hexo-theme-stellar` 核对实际版本。

## 文档

- [从第一篇文章开始](https://xaoxuu.com/wiki/stellar/start/first-site/)
- [把博客变成自己的样子](https://xaoxuu.com/wiki/stellar/start/configuration/)
- [用 Wiki 写项目文档](https://xaoxuu.com/wiki/stellar/guides/wiki/)
- [把文章整理成专栏](https://xaoxuu.com/wiki/stellar/guides/topic/)
- [建立自己的笔记本](https://xaoxuu.com/wiki/stellar/guides/notebook/)
- [主题配置参考](https://xaoxuu.com/wiki/stellar/reference/theme/)
- [从 v1 迁移到 v2](https://xaoxuu.com/wiki/stellar/migration/v1-to-v2/)

## 社区

- [Issues](https://github.com/xaoxuu/hexo-theme-stellar/issues/)：反馈可以复现的问题
- [Discussions](https://github.com/xaoxuu/hexo-theme-stellar/discussions/)：交流使用经验和想法
- [蓝图与展示墙](https://xaoxuu.com/wiki/stellar/support/examples/)：看看不同的人怎样使用 Stellar
- [贡献指南](CONTRIBUTING.md)：参与主题开发与文档维护

## 开源许可

Stellar 使用 [MIT License](LICENSE)，Copyright (c) 2021 xaoxuu，永久开源、完全免费。第三方组件及其许可证见[第三方授权声明](legal/THIRD-PARTY-NOTICES.md)。
