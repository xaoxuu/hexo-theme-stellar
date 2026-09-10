'use strict';

const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');
const { pathToFileURL } = require('url');

const registerUtils = require('../scripts/events/lib/utils');

const ROOT = path.join(__dirname, '..');

test('主题基础图标键使用语义化命名空间，不暴露上游图标集原名', () => {
  const ymlSrc = fs.readFileSync(path.join(ROOT, '_data/icons.yml'), 'utf8');
  assert.doesNotMatch(ymlSrc, /^(?:solar|ph|bxs):/m);
});

test('iconData 返回 icons.yml 原始值（不包 <img>，缺失返回空串）', () => {
  const hexo = {
    stellar: { data: { icons: {
      'test:svg': '<svg></svg>',
      'test:url': 'https://example.com/a.svg'
    } } }
  };
  registerUtils(hexo);
  assert.equal(hexo.utils.iconData('test:svg'), '<svg></svg>');
  assert.equal(hexo.utils.iconData('test:url'), 'https://example.com/a.svg');
  assert.equal(hexo.utils.iconData('missing:key'), '');
});

test('stellar_icon_sets 生成器：按命名空间输出 JSON、去注释、跳过 URL', () => {
  const registrations = {};
  const prevHexo = global.hexo;
  global.hexo = {
    extend: { generator: { register: (name, fn) => { registrations[name] = fn; } }, filter: { register() {} } }
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
    stellar: { data: { icons: {
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

test('deferred-icons Runtime Extension 直接加载命名空间并支持卸载', async () => {
  const modulePath = pathToFileURL(path.join(ROOT, 'source/js/runtime/extensions/deferred-icons.js')).href;
  const { mount } = await import(modulePath);
  const node = {
    isConnected: true,
    outerHTML: '',
    getAttribute: () => 'demo:one'
  };
  const root = { querySelectorAll: () => [node] };
  const previousFetch = global.fetch;
  let requestedUrl = '';
  global.fetch = async url => {
    requestedUrl = url;
    return { ok: true, json: async () => ({ demo: { 'demo:one': '<svg id="loaded"></svg>' } }) };
  };
  try {
    const cleanup = mount(root, { assets: { resolve: value => `/root${value}` } });
    await new Promise(resolve => setImmediate(resolve));
    assert.match(requestedUrl, /^\/root\/js\/icons\/demo\.json/);
    assert.equal(node.outerHTML, '<svg id="loaded"></svg>');
    cleanup();
  } finally {
    global.fetch = previousFetch;
  }
});

test('icons.yml 键完整：静态调用、数据访问和 CSS 变量映射引用均存在', () => {
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
  const reBracket = /(?:icons|stellar_data\(\s*['"]icons['"]\s*\))\[\s*['"]([^'"]+)['"]\s*\]/g;
  const reCssMapping = /['"]--icon-[^'"]+['"]\s*:\s*['"]([a-z0-9]+:[a-zA-Z0-9._-]+)['"]/g;
  for (const f of refs) {
    const src = fs.readFileSync(f, 'utf8');
    for (const m of src.matchAll(reCall)) found.add(m[1]);
    for (const m of src.matchAll(reBracket)) found.add(m[1]);
    for (const m of src.matchAll(reCssMapping)) found.add(m[1]);
  }

  const missing = [...found].filter((k) => !iconKeys.has(k));
  assert.deepEqual(missing, []);
});

test('generated client assets preserve normalized config and invalidate content versions between builds', () => {
  const vm = require('node:vm');
  const { parseStellarConfig } = require('../scripts/lib/config-schema');
  const { clientAssets, resetClientAssets } = require('../scripts/lib/client-assets');
  const { UI_CAPABILITIES } = require('../scripts/lib/ui-capabilities');
  const config = parseStellarConfig({ themeConfig: {} });
  const context = { config: { root: '/docs/' }, stellar: { config, data: { icons: {
    'default:link': '<svg><!-- remove --><text>"</text></svg>',
    'default:loading': 'https://example.com/loading.svg?x="quoted"'
  } } } };
  const first = clientAssets(context);
  const sandbox = { window: {} };
  vm.runInNewContext(first.js.data, sandbox);
  const data = JSON.parse(JSON.stringify(sandbox.window.stellarClientData));
  assert.equal(data.ctx.root, '/docs/');
  assert.deepEqual(data.ctx.ui.classes, UI_CAPABILITIES);
  assert.equal(data.def.avatar, config.fallbacks.avatar);
  assert.equal(data.ctx.search.local_search.field, config.search.local.scope);
  assert.equal(data.ctx.search.local_search.cache_ttl, config.search.local.cacheTtlSeconds);
  assert.equal(data.ctx.icons['default:link'], '<svg><text>"</text></svg>');
  assert.equal(sandbox.window.stellarIcons, sandbox.window.stellarClientData.ctx.icons);
  assert.doesNotMatch(first.js.data, /<\/script|<!--/i);
  assert.match(first.css.data, /\\"quoted\\"/);
  assert.equal(clientAssets(context), first);
  context.stellar.data.icons['default:link'] = '<svg><path/></svg>';
  context.stellar.data.icons['default:loading'] = '<svg/>';
  resetClientAssets();
  const next = clientAssets(context);
  assert.notEqual(next.js.version, first.js.version);
  assert.notEqual(next.css.version, first.css.version);
  const other = { ...context, config: { root: '/' } };
  assert.notEqual(clientAssets(other).js.version, next.js.version);
  context.stellar.data.icons['default:loading'] = '../loading.svg';
  resetClientAssets();
  const relative = clientAssets(context);
  assert.match(relative.css.inline, /\.\.\/loading\.svg/);
  assert.doesNotMatch(relative.css.data, /\.\.\/loading\.svg/);
  resetClientAssets();
});
