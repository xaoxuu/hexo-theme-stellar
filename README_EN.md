# Stellar - Your Own Independent Blog

[English](README_EN.md) · [简体中文](README.md)

[![npm](https://img.shields.io/npm/v/hexo-theme-stellar)](https://www.npmjs.com/package/hexo-theme-stellar)
[![license](https://img.shields.io/github/license/xaoxuu/hexo-theme-stellar)](https://github.com/xaoxuu/hexo-theme-stellar/blob/main/LICENSE)
[![stars](https://img.shields.io/github/stars/xaoxuu/hexo-theme-stellar)](https://github.com/xaoxuu/hexo-theme-stellar)
[![npm downloads](https://img.shields.io/npm/dm/hexo-theme-stellar)](https://www.npmjs.com/package/hexo-theme-stellar)
[![release](https://img.shields.io/github/v/release/xaoxuu/hexo-theme-stellar)](https://github.com/xaoxuu/hexo-theme-stellar/releases)

Stellar is a Hexo theme that unifies blogging and knowledge base in one place. Beneath its clean, business-style aesthetics lie four built-in content systems — Blog, Wiki, Topic, and Notebook — plus a rich collection of tag plugins and dynamic data widgets, ready to use out of the box for every kind of expression.

You can also use it as a lightweight blog theme from day one: install, enable, and start writing. Wiki, Topic, Notebook, and dynamic data widgets are all enabled on demand, growing naturally with your content needs.

## Why Stellar

### Four Content Systems, Integrated in One

- **Blog**: Two article layouts (tech / story) offer different reading experiences, with categories, tags, pagination, and related posts — use it as a lightweight blog right away if that's all you need.
- **Wiki**: Showcase multiple project documentations or use it as your personal knowledge base, with project trees, sections, and hierarchical navigation.
- **Topic**: Manage series of articles with an immersive, continuous reading experience.
- **Notebook**: A three-layer architecture with a tag tree to organize, archive, and retrieve notes with ease.

All four systems and dynamic widgets are integrated out of the box — no need to assemble multiple plugins.

### Expressive Tag Plugins

A large set of flexible and powerful tag plugins — notes, folding, tabs, timelines, galleries, icons, emoji, highlights, OKR, chat, tables, and more — that can be freely mixed and nested, freeing your content from the limits of plain Markdown. See the [tag plugins documentation](https://xaoxuu.com/wiki/stellar/tag-plugins/).

### Dynamic Data Widgets

Static blogs with dynamic capabilities — update content without redeploying:

- **Dynamic timeline**: Post short updates like a social feed, or subscribe to others' timelines.
- **Automated friend links**: Automatically detect link status, tag links, and subscribe to friends' posts.
- **Remote Markdown rendering**: Render a project repository's README directly, avoiding duplicate maintenance.
- **GitHub repository / contributor cards, ratings, votes, latest comments**, and other data widgets — loaded on demand without slowing down the first screen.
- **Community culture**: Subscribe to the "Explorer" timeline data source to learn from the community.

### Experience & Performance

- **Modular design**: Highly reusable widgets with freely configurable left/right sidebars.
- **Design-token-driven styling**: A unified design language, dark mode, and responsive mobile adaptation.
- **Lazy-loaded images** reserve space by original aspect ratio, preventing layout jumps.
- Optional plugins enabled on demand: code highlighting & copy, KaTeX / MathJax, Mermaid diagrams, Fancybox lightbox, Swiper carousel, and more.
- **Local search**: A built-in index generator, with results grouped by section, jumping to anchors and highlighting keywords.
- **Complete SEO**: JSON-LD structured data, Open Graph, canonical URLs, and clone-site detection to protect original content.
- **Multi-author support**: Assign different authors to different posts, each with their own dedicated homepage.

Detailed usage for all of the above can be found in the [documentation](https://xaoxuu.com/wiki/stellar/).

## Examples & Showcase

- Example source: [hexo-theme-stellar-examples](https://github.com/xaoxuu/hexo-theme-stellar-examples/) (`blog` blog scenario, `docs` documentation scenario) — ready to fork and start
- Showcase: [Blogs using Stellar](https://xaoxuu.com/wiki/stellar/examples/)

[![Star History Chart](https://star-history.dera.page/svg?repos=xaoxuu/hexo-theme-stellar&type=date&legend=top-left)](https://star-history.dera.page/#xaoxuu/hexo-theme-stellar&type=date&legend=top-left)

## Quick Start

### Requirements

```yaml
Hexo: 6.3.0 ~ latest (verified up to 8.1.2)
hexo-cli: 4.3.0 ~ latest
node: >= 22 # LTS recommended
npm: >= 10
```

### Install

In the root directory of your blog:

```bash
npm install hexo-theme-stellar
```

### Configure

Edit `_config.yml` and enable the theme:

```yaml
theme: stellar
```

### Start Light

Once configured, you can publish posts immediately. Wiki, Topic, Notebook, and dynamic widgets can be enabled on demand and are documented in detail; alternatively, start from the `blog` scenario in the example repository for a quick setup.

## Documentation

Full documentation: https://xaoxuu.com/wiki/stellar/ (currently available in Chinese)

> AI documentation: https://deepwiki.com/xaoxuu/hexo-theme-stellar/

- Changelog: [CHANGELOG.md](https://github.com/xaoxuu/hexo-theme-stellar/blob/main/CHANGELOG.md) · [Releases](https://github.com/xaoxuu/hexo-theme-stellar/releases)

### Common Topics

- [Tag Plugins](https://xaoxuu.com/wiki/stellar/tag-plugins/)
- [Theme Settings](https://xaoxuu.com/wiki/stellar/theme-settings/)
- [Wiki System](https://xaoxuu.com/wiki/stellar/wiki-settings/)
- [Topic & Notebook](https://xaoxuu.com/wiki/stellar/topic/)

## Feedback

- Issues: https://github.com/xaoxuu/hexo-theme-stellar/issues/
- Discussions: https://github.com/xaoxuu/hexo-theme-stellar/discussions/
- Contributing: [CONTRIBUTING.md](CONTRIBUTING.md) · [Wiki contributors page](https://xaoxuu.com/wiki/stellar/contributors/)

## License

This project is licensed under the [MIT License](LICENSE), Copyright (c) 2021 xaoxuu. Permanently open source and completely free.
