'use strict';

const fs = require('node:fs');
const path = require('node:path');
const frontMatter = require('hexo-front-matter');
const {
  ContentConfigError,
  validateCollectionConfig,
  validatePageConfig,
  validateThemeConfig
} = require('../../lib/content-config');

function sourcePathForData(key) {
  return `source/_data/${key}.yml`;
}

function sourcePathForPage(page) {
  return page.source ? `source/${page.source}` : (page.path || '<page>');
}

function readFrontMatter(ctx, page) {
  if (!page.source) return null;
  const sourcePath = path.join(ctx.source_dir, page.source);
  if (!fs.existsSync(sourcePath)) return null;
  return frontMatter.parse(fs.readFileSync(sourcePath, 'utf8'));
}

module.exports = ctx => {
  const issues = [];
  const data = ctx.locals.get('data');
  const themeConfig = ctx.config.theme_config || ctx.theme.config;
  const themeConfigSource = ctx.config.theme_config
    ? '_config.stellar.yml'
    : 'themes/stellar/_config.yml';

  try {
    validateThemeConfig(themeConfig, themeConfigSource);
  } catch (error) {
    if (!(error instanceof ContentConfigError)) throw error;
    issues.push(...error.issues);
  }

  for (const [key, value] of Object.entries(data)) {
    if (!key.startsWith('wiki/') && !key.startsWith('topic/') && !key.startsWith('notebooks/')) {
      continue;
    }
    try {
      validateCollectionConfig(value, sourcePathForData(key));
    } catch (error) {
      if (!(error instanceof ContentConfigError)) throw error;
      issues.push(...error.issues);
    }
  }

  const validatedSources = new Set();
  for (const collection of [ctx.locals.get('posts'), ctx.locals.get('pages')]) {
    collection.each(page => {
      if (!page.source || validatedSources.has(page.source)) return;
      validatedSources.add(page.source);
      const config = readFrontMatter(ctx, page);
      if (config == null) return;
      try {
        validatePageConfig(config, sourcePathForPage(page));
      } catch (error) {
        if (!(error instanceof ContentConfigError)) throw error;
        issues.push(...error.issues);
      }
    });
  }

  if (issues.length > 0) {
    throw new ContentConfigError(issues);
  }
};
