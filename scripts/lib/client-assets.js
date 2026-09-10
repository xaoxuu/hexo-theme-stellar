"use strict";

const { createHash } = require("node:crypto");
const INTERNAL = require("./internal-constants");
const { UI_CAPABILITIES } = require("./ui-capabilities");
const { resolveServiceProvider } = require("./service-provider");
const { scriptJson } = require("./script-json");

let cache = new WeakMap();
function resetClientAssets() { cache = new WeakMap(); }
function asset(path, data) {
  return { path, data, version: createHash("sha256").update(data).digest("hex").slice(0, 16) };
}

// Site-wide values stay derived from the normalized config and merged icons.
// Page language and permalink remain in defines.ejs.
function clientAssets(hexo) {
  if (cache.has(hexo)) return cache.get(hexo);
  const config = hexo.stellar.config;
  const icons = hexo.stellar.data.icons || {};
  const keys = ['default:link', 'default:to-comment', 'default:profile', 'default:warning',
    'default:settings', 'copy:copy', 'weibo:repeat', 'weibo:like'];
  const clientIcons = Object.fromEntries(keys.map(key => [key, (icons[key] || '').replace(/<!--[\s\S]*?-->/g, '')]));
  const services = JSON.parse(JSON.stringify(INTERNAL.assets.services));
  services.siteinfo.api = resolveServiceProvider(config.services.siteInfo)?.endpoint || null;
  const provider = config.search.provider;
  const search = provider ? { service: provider === 'local' ? 'local_search' : provider } : null;
  if (provider === 'local') {
    search.local_search = {
      field: config.search.local.scope, path: '/search.json', content: config.search.local.includeContent,
      lazy_load: true, cache_ttl: config.search.local.cacheTtlSeconds
    };
    search.path = search.local_search.path;
  }
  const canonical = { ...config.canonical, encoded: Buffer.from(config.canonical.host || '').toString('base64') };
  const data = {
    canonical,
    ctx: {
      root: hexo.config.root,
      tag_plugins: { chat: { api: INTERNAL.assets.services.chat.endpoint } },
      icons: clientIcons,
      ui: { classes: UI_CAPABILITIES },
      services,
      ...(search ? { search } : {})
    },
    def: { avatar: config.fallbacks.avatar, cover: config.fallbacks.cover }
  };
  const js = asset('js/stellar-icons.js', `window.stellarClientData=${scriptJson(data)};\nwindow.stellarIcons=window.stellarClientData.ctx.icons;\n`);
  const cssVars = {
    '--icon-h3-left': 'default:arrow-left', '--icon-h3-right': 'default:arrow-right',
    '--icon-quote-left': 'quot:quote-left', '--icon-quote-right': 'quot:quote-right',
    '--icon-loading': 'default:loading'
  };
  const declarations = [];
  const inlineDeclarations = [];
  for (const [name, key] of Object.entries(cssVars)) {
    const raw = icons[key];
    if (!raw) continue;
    const url = key !== 'default:loading' || raw.trim().startsWith('<svg')
      ? `data:image/svg+xml,${encodeURIComponent(raw)}` : raw;
    // Relative loading URLs resolve against each document, not the external CSS directory.
    const target = key === 'default:loading' && !/^(?:[a-z][a-z\d+.-]*:|\/)/i.test(url.trim())
      ? inlineDeclarations : declarations;
    target.push(`${name}:url(${JSON.stringify(url).replace(/</g, '\\3c ')});`);
  }
  const css = asset('css/stellar-icons.css', declarations.length ? `:root{${declarations.join('')}}\n` : '');
  css.inline = inlineDeclarations.length ? `:root{${inlineDeclarations.join('')}}` : '';
  const result = { js, css };
  cache.set(hexo, result);
  return result;
}

module.exports = { clientAssets, resetClientAssets };
