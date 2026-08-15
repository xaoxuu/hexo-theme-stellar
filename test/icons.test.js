'use strict';

const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');

const registerUtils = require('../scripts/events/lib/utils');

const ROOT = path.join(__dirname, '..');

test('iconData 返回 icons.yml 原始值（不包 <img>，缺失返回空串）', () => {
  const hexo = {
    theme: { config: { icons: {
      'test:svg': '<svg></svg>',
      'test:url': 'https://example.com/a.svg'
    } } }
  };
  registerUtils(hexo);
  assert.equal(hexo.utils.iconData('test:svg'), '<svg></svg>');
  assert.equal(hexo.utils.iconData('test:url'), 'https://example.com/a.svg');
  assert.equal(hexo.utils.iconData('missing:key'), '');
});

test('icon() 对 SVG 默认输出异步占位符，inline=true 原样输出，URL 输出 <img>', () => {
  const hexo = {
    theme: { config: { icons: {
      'test:svg': '<svg viewBox="0 0 24 24"><path fill="currentColor" d="M0 0"/></svg>',
      'test:url': 'https://example.com/a.svg',
      'test:plain': 'plain-value'
    } } }
  };
  registerUtils(hexo);
  assert.equal(hexo.utils.icon('test:svg'), '<svg class="icon" data-icon="test:svg" aria-hidden="true"></svg>');
  assert.equal(hexo.utils.icon('test:svg', '', true), '<svg viewBox="0 0 24 24"><path fill="currentColor" d="M0 0"/></svg>');
  assert.equal(hexo.utils.icon('test:url'), '<img  src="https://example.com/a.svg" />');
  assert.equal(hexo.utils.icon('test:plain'), 'plain-value');
  assert.equal(hexo.utils.icon('missing:key'), 'missing:key');
});

test('stellar_icon_sets 生成器：按命名空间输出 JSON、去注释、跳过 URL', () => {
  const registrations = {};
  const prevHexo = global.hexo;
  global.hexo = {
    extend: { generator: { register: (name, fn) => { registrations[name] = fn; } } }
  };
  try {
    const genPath = require.resolve('../scripts/generators/stellar-icons');
    delete require.cache[genPath];
    require('../scripts/generators/stellar-icons');
  } finally {
    global.hexo = prevHexo;
  }
  assert.equal(typeof registrations.stellar_icons, 'function');
  const files = registrations.stellar_icon_sets.call({
    theme: { config: { icons: {
      'a:one': '<svg><!-- c --><path/></svg>',
      'a:two': '<svg><path/></svg>',
      'b:url': 'https://example.com/a.svg',
      'b:svg': '<svg></svg>'
    } } }
  });
  assert.deepEqual(files, [
    { path: 'js/icons/a.json', data: '{"a":{"a:one":"<svg><path/></svg>","a:two":"<svg><path/></svg>"}}' },
    { path: 'js/icons/b.json', data: '{"b":{"b:svg":"<svg></svg>"}}' }
  ]);
});

test('icons.yml 键完整：所有静态 icon()/iconData()/ctx.icons 引用均存在', () => {
  const ymlSrc = fs.readFileSync(path.join(ROOT, '_data/icons.yml'), 'utf8');
  const iconKeys = new Set();
  for (const m of ymlSrc.matchAll(/^([a-z0-9]+:[a-zA-Z0-9._-]+):\s/gm)) {
    iconKeys.add(m[1]);
  }

  const refs = new Set();
  const dirs = ['layout', 'scripts', 'source/js', 'source/css'];
  const walk = (dir) => {
    for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
      const p = path.join(dir, ent.name);
      if (ent.isDirectory()) walk(p);
      else if (/\.(ejs|js|styl)$/.test(ent.name)) refs.add(p);
    }
  };
  for (const d of dirs) walk(path.join(ROOT, d));

  const found = new Set();
  const reCall = /(?:icon|iconData)\(\s*['"]([^'"]+)['"]/g;
  const reBracket = /icons\[\s*['"]([^'"]+)['"]\s*\]/g;
  for (const f of refs) {
    const src = fs.readFileSync(f, 'utf8');
    for (const m of src.matchAll(reCall)) found.add(m[1]);
    for (const m of src.matchAll(reBracket)) found.add(m[1]);
  }

  // CSS 变量桥接使用的键（head.ejs 中为对象字面量，不走 icon() 调用）
  found.add('default:arrow-left');
  found.add('default:arrow-right');
  found.add('quot:quote-left');
  found.add('quot:quote-right');

  const missing = [...found].filter((k) => !iconKeys.has(k));
  assert.deepEqual(missing, []);
});
