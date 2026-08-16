# Stellar - 每个人的独立博客

[简体中文](README.md) · [English](README_EN.md)

[![npm](https://img.shields.io/npm/v/hexo-theme-stellar)](https://www.npmjs.com/package/hexo-theme-stellar)
[![license](https://img.shields.io/github/license/xaoxuu/hexo-theme-stellar)](https://github.com/xaoxuu/hexo-theme-stellar/blob/main/LICENSE)
[![stars](https://img.shields.io/github/stars/xaoxuu/hexo-theme-stellar)](https://github.com/xaoxuu/hexo-theme-stellar)
[![npm downloads](https://img.shields.io/npm/dm/hexo-theme-stellar)](https://www.npmjs.com/package/hexo-theme-stellar)
[![release](https://img.shields.io/github/v/release/xaoxuu/hexo-theme-stellar)](https://github.com/xaoxuu/hexo-theme-stellar/releases)

Stellar 是一个「博客 + 知识库一体」的 Hexo 主题：简约商务美学之下，内置博客、Wiki、专栏、笔记四大内容系统与丰富的标签、动态数据组件，开箱即用。

可以只把它当作一个轻博客主题使用——安装启用即可写文章；Wiki 知识库、专栏、笔记与动态数据组件都按需启用，随着你的内容需求自然生长。

## 为什么选择 Stellar

### 四大内容系统，一体化整合

- **博客系统**：支持技术 / 生活两种文章布局，分类、标签、分页与相关文章一应俱全；只想写博客时，它就是一个开箱即用的轻博客。
- **Wiki 文档系统**：既可以展示多个项目文档，也可以作为个人知识库，项目树、小节与层级导航开箱即用。
- **专栏系统**：系列文章集中管理，提供沉浸式的连续阅读体验。
- **笔记本系统**：三层架构与标签树导航，方便地梳理、归档和检索笔记。

四套系统与动态数据组件一体化整合，无需拼装多个插件。

### 富表达标签组件

内置大量灵活而强大的标签组件——提示框、折叠、标签页、时间线、图库、图标、表情、高亮、OKR、聊天、表格等，互相之间可以自由混搭嵌套，让内容表达不再受 Markdown 语法限制。详见[标签组件文档](https://xaoxuu.com/wiki/stellar/tag-plugins/)。

### 动态数据组件

静态博客也能拥有动态能力，内容更新无需重新部署：

- **动态时间线**：像发朋友圈一样发布短文，也可以订阅他人的时间线。
- **自动化友链**：自动检测友链状态、打标签、订阅友链文章。
- **远程 Markdown 渲染**：例如直接渲染项目仓库的 README，避免重复维护。
- **GitHub 仓库 / 贡献者卡片、评分、投票、最新评论**等数据组件，按需加载，不拖慢首屏。
- **社区文化**：可以订阅「探索号」时间线数据源，获取社区用户的宝贵经验分享。

### 体验与性能

- **模块化设计**：内置多种高复用性小组件，左右侧边栏自由搭配，布局随心。
- **设计令牌驱动的样式系统**：统一的设计语言、深色模式与移动端响应式适配。
- **图片懒加载**按原图比例预留占位，不会出现高度跳变，体验更佳。
- 可选插件按需启用：代码高亮与复制、KaTeX / MathJax 数学渲染、Mermaid 图表、Fancybox 灯箱、Swiper 轮播等。
- **本地搜索**：内置索引生成器，结果按章节展示，点击直达锚点并高亮关键词。
- **SEO 完备**：JSON-LD 结构化数据、Open Graph、canonical 与克隆站检测，保护原创内容。
- **一站多作者**：可以为不同文章指定不同作者，每位作者都有专属主页。

以上功能都可以在[文档](https://xaoxuu.com/wiki/stellar/)中找到详细的使用方法。

## 示例与展示

- 示例源码：[hexo-theme-stellar-examples](https://github.com/xaoxuu/hexo-theme-stellar-examples/)（`blog` 博客场景、`docs` 文档场景），可直接 fork 起步
- 展示墙：[使用 Stellar 主题的博客](https://xaoxuu.com/wiki/stellar/examples/)

[![Star History Chart](https://star-history.dera.page/svg?repos=xaoxuu/hexo-theme-stellar&type=date&legend=top-left)](https://star-history.dera.page/#xaoxuu/hexo-theme-stellar&type=date&legend=top-left)

## 快速开始

### 环境要求

```yaml
Hexo: 6.3.0 ~ latest（已验证至 8.1.2）
hexo-cli: 4.3.0 ~ latest
node: >= 22 # 建议选择 LTS 版本
npm: >= 10
```

### 安装

在博客根目录执行：

```bash
npm install hexo-theme-stellar
```

### 配置

编辑 `_config.yml`，启用主题：

```yaml
theme: stellar
```

### 从轻博客开始

配置完成后即可发布文章。Wiki、专栏、笔记本与动态数据组件按需启用，文档中均有详细说明；也可以直接参考示例仓库的 `blog` 场景快速搭建。

## 使用文档

完整文档请见：https://xaoxuu.com/wiki/stellar/

> AI 文档：https://deepwiki.com/xaoxuu/hexo-theme-stellar/

- 更新日志：[CHANGELOG.md](https://github.com/xaoxuu/hexo-theme-stellar/blob/main/CHANGELOG.md) · [Releases](https://github.com/xaoxuu/hexo-theme-stellar/releases)

### 常用文档

- [标签组件](https://xaoxuu.com/wiki/stellar/tag-plugins/)
- [主题配置](https://xaoxuu.com/wiki/stellar/theme-settings/)
- [Wiki 系统](https://xaoxuu.com/wiki/stellar/wiki-settings/)
- [专栏与笔记](https://xaoxuu.com/wiki/stellar/topic/)

## 反馈

- 提交 Issues：https://github.com/xaoxuu/hexo-theme-stellar/issues/
- 参与讨论：https://github.com/xaoxuu/hexo-theme-stellar/discussions/
- 贡献指南：[CONTRIBUTING.md](CONTRIBUTING.md) · [Wiki 贡献页](https://xaoxuu.com/wiki/stellar/contributors/)

## 开源许可

本项目采用 [MIT License](LICENSE)，Copyright (c) 2021 xaoxuu，永久开源、完全免费。
