'use strict';

/**
 * Stellar 主题 ESLint 配置（flat config）
 *
 * 分层：
 *   - scripts/、ci/、release.js、test/：Node + CommonJS + 现代语法
 *   - source/js/：浏览器环境 + 现代语法（源码按 ES2015+ 编写，Gulp Babel 转译输出）
 *
 * 风格类规则（引号、分号、缩进等）暂不强制，避免对既有代码大面积改写；
 * 优先启用正确性类规则（未定义变量、不可达代码、重复声明等），
 * 新增代码请遵循 CLAUDE.md 的编码规范。
 */

const js = require('@eslint/js');
const globals = require('globals');

const CORRECTNESS_RULES = {
  'no-undef': 'error',
  'no-unreachable': 'error',
  'no-constant-condition': ['error', { checkLoops: false }],
  'no-cond-assign': 'error',
  'no-dupe-args': 'error',
  'no-dupe-keys': 'error',
  'no-duplicate-case': 'error',
  'no-empty': ['error', { allowEmptyCatch: true }],
  'no-extra-boolean-cast': 'error',
  'no-func-assign': 'error',
  'no-import-assign': 'error',
  'no-obj-calls': 'error',
  'no-prototype-builtins': 'error',
  'no-self-assign': 'error',
  'no-unexpected-multiline': 'error',
  'valid-typeof': 'error',
  'use-isnan': 'error',
  // 既有代码存在 ES5 风格 var 重复声明、无用局部变量与转义字符噪音，
  // v1 暂不强制，避免大规模改动；后续清理后可按 CLAUDE.md 逐步收紧。
  'no-unused-vars': 'off',
  'no-redeclare': 'off',
  'no-useless-escape': 'off',
  'no-inner-declarations': 'off',
};

module.exports = [
  {
    ignores: [
      'node_modules/**',
      'public/**',
      '.deploy_git/**',
      '.cache/**',
      'layout/**',
      'source/css/**',
      'languages/**',
      '_data/**',
      'docs/**',
      '.github/**',
    ],
  },
  js.configs.recommended,
  {
    files: ['scripts/**/*.js', 'ci/**/*.js', 'release.js', 'test/**/*.js', 'eslint.config.js'],
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'commonjs',
      globals: {
        ...globals.node,
        // Hexo 运行时注入的全局对象；部分文件已用 /* global hexo */ 声明，此处兜底
        hexo: 'readonly',
      },
    },
    rules: CORRECTNESS_RULES,
  },
  {
    files: ['source/js/**/*.js'],
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'script',
      globals: {
        ...globals.browser,
        // 浏览器 API（部分未包含在 browser globals 中，显式补充）
        fetch: 'readonly',
        Promise: 'readonly',
        IntersectionObserver: 'readonly',
        MutationObserver: 'readonly',
        requestAnimationFrame: 'readonly',
        cancelAnimationFrame: 'readonly',
        URL: 'readonly',
        // 主题在 layout/_partial/scripts/*.ejs 中注入的页面级全局对象
        utils: 'readonly',
        def: 'readonly',
        ctx: 'readonly',
        sidebar: 'readonly',
        hud: 'readonly',
        stellar: 'writable',
        comment: 'writable',
        // 外部库全局（CDN 引入）
        marked: 'readonly',
        algoliasearch: 'readonly',
      },
    },
    rules: CORRECTNESS_RULES,
  },
];
