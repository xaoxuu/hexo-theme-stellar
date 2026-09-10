'use strict';

function preserveRuntimeModules() {
  const minify = hexo.config.minify;
  if (!minify || typeof minify !== 'object') return;

  // hexo-minify parses JS as classic scripts by default. Keep native ESM intact,
  // including top-level await and versioned imports, as in the CI build pipeline.
  const pattern = '**/js/runtime/**';
  const exclude = typeof minify.exclude === 'string'
    ? [minify.exclude]
    : Array.isArray(minify.exclude) ? minify.exclude : [];
  if (!exclude.includes(pattern)) minify.exclude = [...exclude, pattern];
}

hexo.extend.filter.register('after_init', preserveRuntimeModules);
hexo.extend.filter.register('before_generate', preserveRuntimeModules);
