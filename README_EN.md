<div align="center">
  <img src="assets/icon-v2-x512.webp" width="160" alt="Stellar">
  <h1>Stellar</h1>
  <p>A blog that grows with your work</p>
  <p>A complete, versatile, and feature-rich personal knowledge base designed to grow over time.</p>
  <p><a href="README_EN.md">English</a> · <a href="README.md">简体中文</a></p>
  <p>
    <a href="https://github.com/xaoxuu/hexo-theme-stellar/releases"><img src="https://img.shields.io/github/v/release/xaoxuu/hexo-theme-stellar" alt="release"></a>
    <a href="https://www.npmjs.com/package/hexo-theme-stellar"><img src="https://img.shields.io/npm/v/hexo-theme-stellar" alt="npm"></a>
    <a href="https://www.npmjs.com/package/hexo-theme-stellar"><img src="https://img.shields.io/npm/dm/hexo-theme-stellar" alt="npm downloads"></a>
    <a href="https://github.com/xaoxuu/hexo-theme-stellar"><img src="https://img.shields.io/github/stars/xaoxuu/hexo-theme-stellar" alt="stars"></a>
    <a href="LICENSE"><img src="https://img.shields.io/github/license/xaoxuu/hexo-theme-stellar" alt="license"></a>
  </p>
  <p>
    <a href="https://xaoxuu.com/wiki/stellar/start/install/">Create your first blog</a> ·
    <a href="https://xaoxuu.com/wiki/stellar/support/examples/">Site examples</a> ·
    <a href="https://xaoxuu.com/wiki/stellar/">Documentation</a>
  </p>
</div>

## Bring order to everything you publish

> True simplicity is not just subtraction; it is creating order within complexity.

### A complete system for organizing content

Start with regular posts. Give a project its own Wiki when it needs stable documentation, collect related posts into a Topic, and keep evolving knowledge in a Notebook. They share the same navigation, search, sidebars, and reading experience, while unused content systems stay out of the way.

### Flexible layout and expression

From appearance presets, colors, and type to columns, tabs, folding sections, and galleries, you can shape both the site and the way its content is presented. Local search can take readers directly to a matching section, while responsive layouts leave the main space to the article on narrow screens.

### Static pages that stay fresh

Your writing preserves ideas while external data stays current. Remote content, community data, and external services can load on demand without being coupled to the static article, so frequently changing data does not require a full-site rebuild.

## Site examples

[Stellar Examples](https://github.com/xaoxuu/hexo-theme-stellar-examples/) provides runnable sites you can explore before replacing their content and configuration at your own pace. Visit [Site examples](https://xaoxuu.com/wiki/stellar/support/examples/) for more real sites.

## Get started

### Requirements

- Node.js 22 or newer
- Hexo 8 or newer

### Create from a Blueprint

With Git and npm available, launch the interactive Blueprint installer with one command:

macOS / Linux:

```bash
sh -c "$(curl -fsSL https://github.com/xaoxuu/hexo-theme-stellar-examples/raw/main/install.sh)"
```

Windows PowerShell 7+ (`pwsh`):

```powershell
& ([scriptblock]::Create((Invoke-RestMethod https://github.com/xaoxuu/hexo-theme-stellar-examples/raw/main/install.ps1)))
```

The installer reads the example repository's [`blueprints.json`](https://github.com/xaoxuu/hexo-theme-stellar-examples/blob/main/blueprints.json), presents the available Blueprints, then confirms the Blueprint, project directory, dependency installation, and creation plan.

### Install from npm

Install the default version currently provided by npm, then confirm what was installed:

```bash
npm install hexo-theme-stellar
npm ls hexo-theme-stellar
```

### Follow the latest source

Add the official repository's `main` branch as a submodule and install the theme's own dependencies:

```bash
git submodule add -b main https://github.com/xaoxuu/hexo-theme-stellar.git themes/stellar
npm install --prefix themes/stellar
```

### Enable and check

Enable the theme in your site's `_config.yml`:

```yaml
theme: stellar
```

Then run Doctor and generate the site:

```bash
npx hexo stellar doctor
npx hexo generate
```

See [Installation](https://xaoxuu.com/wiki/stellar/start/install/) and [Create your first site](https://xaoxuu.com/wiki/stellar/start/first-site/) for the complete workflow.

## Documentation and community

- [Configure your site](https://xaoxuu.com/wiki/stellar/start/configuration/)
- [Use content components](https://xaoxuu.com/wiki/stellar/reference/tags/)
- [Manage Wikis, Topics, and Notebooks](https://xaoxuu.com/wiki/stellar/reference/collection/)
- [Theme configuration reference](https://xaoxuu.com/wiki/stellar/reference/theme/)
- [Migrate from v1 to v2](https://xaoxuu.com/wiki/stellar/migration/v1-to-v2/)
- [Issues](https://github.com/xaoxuu/hexo-theme-stellar/issues/) for reproducible problems
- [Discussions](https://github.com/xaoxuu/hexo-theme-stellar/discussions/) for ideas and usage questions
- [Contributing](CONTRIBUTING.md) for code and documentation work

## License

Stellar is free and open source under the [MIT License](LICENSE). Third-party licenses are listed in [THIRD-PARTY-NOTICES.md](legal/THIRD-PARTY-NOTICES.md).
