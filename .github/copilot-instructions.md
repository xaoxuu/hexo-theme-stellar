# GitHub Copilot Instructions for hexo-theme-stellar

This is the **Stellar** Hexo theme. A standalone npm package for static blog theming.

## Tech Stack
- **Templates**: EJS (`layout/`)
- **CSS**: Stylus (`source/css/`)
- **Server JS**: CommonJS, ES5 (`scripts/`)
- **Client JS**: ES5, Babel-transpiled (`source/js/`)
- **Build**: Gulp (post-processing in host project)

## EJS Templates
- Use `<% %>` for logic, `<%- %>` for unescaped output
- 2-space indent, double-quoted HTML attrs, `var` declarations
- Reusable parts → `_partial/`; complex logic → `helpers/`

## Node.js Scripts (`scripts/`)
- `/* global hexo */` + `'use strict';` at top
- CommonJS: `require()` / `module.exports`
- Tags: `hexo.extend.tag.register(name, handler, options)`
- Helpers: `hexo.extend.helper.register(name, handler)`

## Stylus (`source/css/`)
- Import order: `const` → `custom` → `theme_base` → `theme_colorful` → `func`
- `kebab-case` for class/file names, 2-space indent
- IE8 CSS compat required

## Client JS (`source/js/`)
- ES5 syntax, Babel transpiles to ES2015+
- Theme util functions over direct DOM manipulation

## New Feature Checklist
Every new feature must touch: `layout/` + `scripts/` + `source/css/` + `source/js/` (if needed) + `docs/`

## Constraints
- No new build systems; keep Hexo native + Gulp
- No mixing EJS with frontend frameworks
- CSS: IE8 compat; JS: ES2015+ compat
- Update version + CHANGELOG before npm publish
