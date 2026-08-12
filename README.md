# Stellar - 每个人的独立博客

[![npm](https://img.shields.io/npm/v/hexo-theme-stellar)](https://www.npmjs.com/package/hexo-theme-stellar)
[![license](https://img.shields.io/github/license/xaoxuu/hexo-theme-stellar)](https://github.com/xaoxuu/hexo-theme-stellar/blob/main/LICENSE)
[![stars](https://img.shields.io/github/stars/xaoxuu/hexo-theme-stellar)](https://github.com/xaoxuu/hexo-theme-stellar)
[![npm downloads](https://img.shields.io/npm/dm/hexo-theme-stellar)](https://www.npmjs.com/package/hexo-theme-stellar)
[![release](https://img.shields.io/github/v/release/xaoxuu/hexo-theme-stellar)](https://github.com/xaoxuu/hexo-theme-stellar/releases)

Stellar 是一个功能强大的综合型 Hexo 主题，内置博客、知识库、专栏、笔记四大系统，并提供丰富的标签组件与动态数据组件，开箱即用。

## 亮点

- 支持技术 / 生活两种文章布局风格，为不同类型的文章呈现不同的阅读体验。
- 内置 Wiki 系统，既可以展示多个项目文档，也可以作为个人知识库。
- 内置专栏系统，支持沉浸式阅读专栏系列文章。
- 内置笔记系统，方便地梳理和归档笔记。
- 内置大量灵活而强大的标签组件，互相之间可以自由混搭嵌套。
- 内置多种动态数据组件，让静态博客的内容更新不再依赖重新部署：
  - 动态时间线：像发朋友圈一样发布短文，也可以订阅他人的时间线。
  - 自动化友链：自动检测友链状态、打标签、订阅友链文章。
  - 远程 Markdown 渲染：例如直接渲染项目仓库的 README，避免重复维护。
- 模块化设计，内置多种高复用性的小组件，可以自由搭配布局。
- 图片懒加载时按原图比例预留占位，不会出现高度跳变，体验更佳。
- 支持一站多作者，可以为不同文章指定不同作者，每位作者都有专属主页。
- 社区文化：可以订阅「探索号」时间线数据源，获取社区用户的宝贵经验分享。

以上功能都可以在 [文档](https://xaoxuu.com/wiki/stellar/) 中找到详细的使用方法。

[![Star History Chart](https://star-history.dera.page/svg?repos=xaoxuu/hexo-theme-stellar&type=date&legend=top-left)](https://star-history.dera.page/#xaoxuu/hexo-theme-stellar&type=date&legend=top-left)

## 示例与展示

- 示例源码：[hexo-theme-stellar-examples](https://github.com/xaoxuu/hexo-theme-stellar-examples/)（`blog` 博客场景、`docs` 文档场景）
- 展示墙：[使用 Stellar 主题的博客](https://xaoxuu.com/wiki/stellar/examples/)（30 个站点）

部分使用站点：[杜老师说](https://dusays.com)、[Watermelonabc](https://watermelonabc.top/)、[妄司逸](https://blog.flechazo.icu/)

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

## 使用文档

完整文档请见：https://xaoxuu.com/wiki/stellar/

> AI 文档：https://deepwiki.com/xaoxuu/hexo-theme-stellar/

- 更新日志：[CHANGELOG.md](https://github.com/xaoxuu/hexo-theme-stellar/blob/main/CHANGELOG.md) · [Releases](https://github.com/xaoxuu/hexo-theme-stellar/releases)

## 常用文档

- [标签组件](https://xaoxuu.com/wiki/stellar/tag-plugins/)
- [主题配置](https://xaoxuu.com/wiki/stellar/theme-settings/)
- [Wiki 系统](https://xaoxuu.com/wiki/stellar/wiki-settings/)
- [专栏与笔记](https://xaoxuu.com/wiki/stellar/topic/)

## 反馈

- 提交 Issues：https://github.com/xaoxuu/hexo-theme-stellar/issues/
- 参与讨论：https://github.com/xaoxuu/hexo-theme-stellar/discussions/
- 贡献指南：[CONTRIBUTING.md](CONTRIBUTING.md) · [Wiki 贡献页](https://xaoxuu.com/wiki/stellar/contributors/)
