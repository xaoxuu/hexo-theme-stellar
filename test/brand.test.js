'use strict';

const { test } = require('node:test');
const assert = require('node:assert/strict');

const {
  collectionBrand,
  replaceConfigTokens,
  resolveBrands,
  shouldShowMobileBrand
} = require('../scripts/lib/brand');

test('Wiki、Notebook 与 Topic Collection Brand 使用 identity 和各自入口', () => {
  const base = {
    name: 'Project',
    tagline: 'Tagline',
    identity: { icon: '/project.svg' }
  };
  assert.deepStrictEqual(collectionBrand({ ...base, homepage: { path: '/wiki/project/' } }, 'wiki', '/default.svg'), {
    image: { src: '/project.svg', variant: 'icon' },
    name: 'Project',
    tagline: 'Tagline',
    href: '/wiki/project/'
  });
  assert.equal(collectionBrand({ ...base, route: { path: '/topic/project/' } }, 'topic').href, '/topic/project/');
  assert.equal(collectionBrand({ ...base, route: { path: 'notes/project' } }, 'notebook').href, 'notes/project');
  assert.equal(collectionBrand({
    name: 'Project',
    card: { cover: '/cover.webp' }
  }, 'wiki', '/default.svg').image.src, '/default.svg');
  assert.equal(collectionBrand(base, 'post', '/default.svg'), null);
});

test('站点与 Collection Brand 独立解析且不互相继承', () => {
  const collection = {
    name: 'Collection',
    identity: { icon: '/auto.svg' },
    route: { path: '/topic/collection/' }
  };
  assert.deepStrictEqual(resolveBrands({
    siteBrand: {
      image: { src: '/site.svg', variant: 'avatar', href: '/must-not-leak/' },
      name: 'Site',
      wordmark: '/removed.svg',
      github: { id: 'must-not-leak' },
      tagline: 'Site tagline',
      href: '/must-not-leak/'
    },
    collection,
    collectionType: 'topic',
    defaultIcon: '/default.svg'
  }), {
    site: {
      image: { src: '/site.svg', variant: 'avatar' },
      name: 'Site',
      tagline: 'Site tagline',
      href: '/'
    },
    collection: {
      image: { src: '/auto.svg', variant: 'icon' },
      name: 'Collection',
      href: '/topic/collection/'
    }
  });
});

test('Topic 同时提供独立站点 Brand 与 Collection Brand', () => {
  const siteBrand = {
    image: { src: '/site.svg', variant: 'avatar' },
    name: 'Site',
    tagline: 'Site tagline'
  };
  const topic = {
    name: 'Topic',
    tagline: 'Topic tagline',
    identity: { icon: '/topic.svg' },
    route: { path: '/topic/example/' }
  };
  assert.deepStrictEqual(resolveBrands({
    siteBrand,
    collection: topic,
    collectionType: 'topic',
    defaultIcon: '/default.svg'
  }), {
    site: { ...siteBrand, href: '/' },
    collection: {
      image: { src: '/topic.svg', variant: 'icon' },
      name: 'Topic',
      tagline: 'Topic tagline',
      href: '/topic/example/'
    }
  });
});

test('手机端 Main Site Brand 在博客和全部 Collection 列表 Profile 显示', () => {
  for (const profileKey of [
    'home',
    'blogIndex',
    'topicIndex',
    'wikiIndex',
    'notebookIndex',
    'noteIndex'
  ]) {
    assert.equal(shouldShowMobileBrand({ profileKey }), true);
  }
  for (const profileKey of [
    'page',
    'post',
    'topic',
    'wiki',
    'error',
    'settings'
  ]) {
    assert.equal(shouldShowMobileBrand({ profileKey }), false);
  }
});

test('Brand 文本只替换 Hexo 配置占位符，不解析 Markdown', () => {
  assert.equal(replaceConfigTokens('{config.title} | {config.subtitle}', {
    title: 'Stellar',
    subtitle: 'Blog'
  }), 'Stellar | Blog');
  assert.equal(replaceConfigTokens('[Stellar](/)', { title: 'Ignored' }), '[Stellar](/)');
});

test("Notebook 生成页可按来源读取独立 Brand", () => {
  const helpers = {};
  const previousHexo = global.hexo;
  global.hexo = {
    extend: {
      helper: {
        register(name, callback) {
          helpers[name] = callback;
        }
      }
    },
    stellar: {
      config: {
        brand: { name: "Site" },
        fallbacks: { projectIcon: "/default.svg" }
      },
      data: {
        widgets: { ghuser: { username: " xaoxuu " } },
        wiki: { tree: {} },
        topic: { tree: {} },
        notebooks: {
          tree: {
            dev: {
              name: "Dev Notes",
              identity: { icon: "/dev.svg" },
              route: { path: "notes/dev" }
            }
          }
        }
      }
    }
  };

  const helperPath = require.resolve("../scripts/helpers/brand");
  delete require.cache[helperPath];
  require(helperPath);
  const page = {
    layout: "notes",
    stellarConfig: {
      collection: { profile: "notebook", id: "dev" },
      leftbar: { brand: "collection_brand" }
    }
  };

  assert.deepStrictEqual(helpers.brandConfig(page, "site"), { name: "Site", href: "/" });
  assert.deepStrictEqual(helpers.brandConfig(page, "collection"), {
    image: { src: "/dev.svg", variant: "icon" },
    name: "Dev Notes",
    href: "notes/dev"
  });
  assert.equal(helpers.brandGithubUsername(), "xaoxuu");
  delete require.cache[helperPath];
  global.hexo = previousHexo;
});
