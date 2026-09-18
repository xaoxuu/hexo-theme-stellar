<div align="center">
  <img src="assets/icon-v2-x512.webp" width="160" alt="Stellar">
  <h1>Stellar</h1>
  <p>每个人的独立博客</p>
  <p>基于 Hexo 的全能个人知识库，开箱即用，内置海量标签和动态数据组件。可用于个人博客、项目文档、知识库、专栏、笔记等。</p>
  <p><a href="README.md">简体中文</a> · <a href="README_EN.md">English</a></p>
  <p>
    <a href="https://github.com/xaoxuu/hexo-theme-stellar/releases"><img src="https://img.shields.io/github/v/release/xaoxuu/hexo-theme-stellar" alt="release"></a>
    <a href="https://www.npmjs.com/package/hexo-theme-stellar"><img src="https://img.shields.io/npm/v/hexo-theme-stellar" alt="npm"></a>
    <a href="https://www.npmjs.com/package/hexo-theme-stellar"><img src="https://img.shields.io/npm/dm/hexo-theme-stellar" alt="npm downloads"></a>
    <a href="https://github.com/xaoxuu/hexo-theme-stellar"><img src="https://img.shields.io/github/stars/xaoxuu/hexo-theme-stellar" alt="stars"></a>
    <a href="LICENSE"><img src="https://img.shields.io/github/license/xaoxuu/hexo-theme-stellar" alt="license"></a>
  </p>
  <p>
    <a href="https://xaoxuu.com/wiki/stellar/start/install/">创建第一个博客</a> ·
    <a href="https://xaoxuu.com/wiki/stellar/support/examples/">站点示例</a> ·
    <a href="https://xaoxuu.com/wiki/stellar/">完整文档</a>
  </p>
</div>

## 在纷繁中建立秩序

> 真正的简约不止删繁就简，而是在纷繁中建立秩序。

### 完善的内容组织体系

从普通文章开始。项目需要稳定的文档目录时，用 Wiki；文章逐渐形成系列时，收进专栏；零散知识需要长期积累时，放进笔记本。它们共享同一套导航、搜索、侧栏与阅读体验，没有启用的内容系统不会增加额外负担。

### 灵活的排版与表达方式

从外观预设、配色和字体，到分栏、选项卡、折叠块与图库，站点的样子和内容的表达方式都可以按需组合。本地搜索可以直接定位到相关章节，响应式布局会在窄屏上把主要空间留给正文。

### 静态页面，也能常看常新

手写内容沉淀观点，外部数据保持新鲜。远程内容、社区数据和外部服务可以按需加载，与静态正文保持解耦；经常变化的数据不必每次都随整站重新生成。

## 站点示例

[Stellar Examples](https://github.com/xaoxuu/hexo-theme-stellar-examples/) 提供可以直接运行的示例站，适合先体验接近自己目标的站点，再逐步替换内容与配置。更多真实站点见[站点示例](https://xaoxuu.com/wiki/stellar/support/examples/)。

## 开始使用

### 环境要求

- Node.js 22 或更高版本
- Hexo 8 或更高版本

### 从蓝图创建

准备好 Git 和 npm 后，一条命令即可启动交互式蓝图安装器：

macOS / Linux：

```bash
sh -c "$(curl -fsSL https://github.com/xaoxuu/hexo-theme-stellar-examples/raw/main/install.sh)"
```

Windows PowerShell 7+（`pwsh`）：

```powershell
& ([scriptblock]::Create((Invoke-RestMethod https://github.com/xaoxuu/hexo-theme-stellar-examples/raw/main/install.ps1)))
```

安装器会读取示例仓库的 [`blueprints.json`](https://github.com/xaoxuu/hexo-theme-stellar-examples/blob/main/blueprints.json)，展示当前可用的蓝图，并依次确认蓝图、项目目录、依赖安装和创建计划。

### 从 npm 安装

在博客根目录安装 npm 当前提供的默认版本，并确认实际安装结果：

```bash
npm install hexo-theme-stellar
npm ls hexo-theme-stellar
```

### 跟随最新源码

将官方仓库的 `main` 分支添加为子模块，并安装主题自身的依赖：

```bash
git submodule add -b main https://github.com/xaoxuu/hexo-theme-stellar.git themes/stellar
npm install --prefix themes/stellar
```

### 启用并检查

在博客 `_config.yml` 中启用主题：

```yaml
theme: stellar
```

然后运行 Doctor 并生成站点：

```bash
npx hexo stellar doctor
npx hexo generate
```

完整步骤见[环境与安装](https://xaoxuu.com/wiki/stellar/start/install/)和[创建第一个站点](https://xaoxuu.com/wiki/stellar/start/first-site/)。

## 文档与社区

- [配置自己的站点](https://xaoxuu.com/wiki/stellar/start/configuration/)
- [使用内容组件](https://xaoxuu.com/wiki/stellar/reference/tags/)
- [管理 Wiki、专栏与笔记本](https://xaoxuu.com/wiki/stellar/reference/collection/)
- [主题配置参考](https://xaoxuu.com/wiki/stellar/reference/theme/)
- [从 v1 迁移到 v2](https://xaoxuu.com/wiki/stellar/migration/v1-to-v2/)
- [Issues](https://github.com/xaoxuu/hexo-theme-stellar/issues/)：反馈可以复现的问题
- [Discussions](https://github.com/xaoxuu/hexo-theme-stellar/discussions/)：交流使用经验和想法
- [贡献指南](CONTRIBUTING.md)：参与主题开发与文档维护

## 开源许可

Stellar 使用 [MIT License](LICENSE)，Copyright (c) 2021 xaoxuu，永久开源、完全免费。第三方组件及其许可证见[第三方授权声明](legal/THIRD-PARTY-NOTICES.md)。
