'use strict';

const { test } = require('node:test');
const assert = require('node:assert/strict');

const {
  automaticCollectionBrand,
  replaceConfigTokens,
  resolveBrand,
  shouldShowMobileBrand
} = require('../scripts/lib/brand');

test('Wiki 与 Notebook 自动 Brand 使用 identity、文案和集合首页', () => {
  const base = {
    name: 'Project',
    tagline: 'Tagline',
    identity: { icon: '/project.svg' }
  };
  assert.deepStrictEqual(automaticCollectionBrand({ ...base, homepage: { path: '/wiki/project/' } }, 'wiki', '/default.svg'), {
    image: { src: '/project.svg', variant: 'icon' },
    name: 'Project',
    tagline: 'Tagline',
    url: '/wiki/project/'
  });
  assert.deepStrictEqual(automaticCollectionBrand({ ...base, route: { path: '/topic/project/' } }, 'topic'), {});
  assert.equal(automaticCollectionBrand({ ...base, route: { path: 'notes/project' } }, 'notebook').url, 'notes/project');
  assert.equal(automaticCollectionBrand({
    name: 'Project',
    card: { cover: '/cover.webp' }
  }, 'wiki', '/default.svg').image.src, '/default.svg');
});

test('Brand 按页面、集合、自动值和全局值解析，image 整体替换', () => {
  const collection = {
    name: 'Collection',
    tagline: 'Auto',
    identity: { icon: '/auto.svg' },
    route: { path: '/topic/collection/' },
    sidebar: {
      left: {
        brand: {
          image: { src: '/collection.svg', style: 'plain' },
          tagline: 'Collection override'
        }
      }
    }
  };
  assert.deepStrictEqual(resolveBrand({
    siteBrand: {
      image: { src: '/site.svg', style: 'avatar' },
      name: 'Site',
      tagline: 'Site tagline',
      url: '/'
    },
    collection,
    collectionType: 'topic',
    defaultIcon: '/default.svg',
    pageBrand: { name: 'Page' }
  }), {
    image: { src: '/collection.svg', variant: 'plain' },
    name: 'Page',
    tagline: 'Collection override',
    url: '/'
  });
  assert.deepStrictEqual(resolveBrand({
    siteBrand: { image: { src: '/site.svg', style: 'avatar' }, name: 'Site' },
    pageBrand: { tagline: 'Page' }
  }), {
    image: { src: '/site.svg', variant: 'avatar' },
    name: 'Site',
    tagline: 'Page'
  });
  assert.deepStrictEqual(resolveBrand({
    siteBrand: { tagline: 'Site fallback', url: '/' },
    collection: { name: 'Collection', identity: { icon: '/auto.svg' } },
    collectionType: 'wiki'
  }), {
    image: { src: '/auto.svg', variant: 'icon' },
    name: 'Collection',
    tagline: 'Site fallback',
    url: '/'
  });
});

test('Topic 默认完整继承全局 Brand，只有显式 Brand 才覆盖', () => {
  const siteBrand = {
    image: { src: '/site.svg', variant: 'avatar' },
    name: 'Site',
    tagline: 'Site tagline',
    url: '/'
  };
  const topic = {
    name: 'Topic',
    tagline: 'Topic tagline',
    identity: { icon: '/topic.svg' },
    route: { path: '/topic/example/' }
  };
  assert.deepStrictEqual(resolveBrand({
    siteBrand,
    collection: topic,
    collectionType: 'topic',
    defaultIcon: '/default.svg'
  }), siteBrand);

  topic.sidebar = { left: { brand: { name: 'Custom Topic' } } };
  assert.deepStrictEqual(resolveBrand({
    siteBrand,
    collection: topic,
    collectionType: 'topic',
    defaultIcon: '/default.svg'
  }), {
    ...siteBrand,
    name: 'Custom Topic'
  });
});

test('手机端 Brand 只在指定列表和聚合页面显示', () => {
  for (const state of [
    { isHome: true },
    { isCategory: true },
    { isTag: true },
    { layout: 'categories' },
    { layout: 'tags' },
    { layout: 'index_topic' },
    { layout: 'index_wiki' },
    { layout: 'notebooks' },
    { layout: 'notes' }
  ]) {
    assert.equal(shouldShowMobileBrand(state), true);
  }
  for (const layout of ['post', 'page', 'wiki', 'topic', 'note', 'archive', 'author', '404']) {
    assert.equal(shouldShowMobileBrand({ layout }), false);
  }
});

test('Brand 文本只替换 Hexo 配置占位符，不解析 Markdown', () => {
  assert.equal(replaceConfigTokens('{config.title} | {config.subtitle}', {
    title: 'Stellar',
    subtitle: 'Blog'
  }), 'Stellar | Blog');
  assert.equal(replaceConfigTokens('[Stellar](/)', { title: 'Ignored' }), '[Stellar](/)');
});

test("Notebook 生成页 Brand 消费 stellarConfig 而非原始页面字段", () => {
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
        site: {
          brand: { name: "Site", url: "/" }
        }
      }
    },
    theme: {
      config: {
        default: { project: "/default.svg" },
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
  const brand = helpers.brandConfig({
    layout: "notes",
    stellarConfig: {
      collection: { profile: "notebook", id: "dev" },
      sidebar: { left: { brand: { tagline: "Generated page" } } }
    }
  });

  assert.deepStrictEqual(brand, {
    image: { src: "/dev.svg", variant: "icon" },
    name: "Dev Notes",
    tagline: "Generated page",
    url: "notes/dev"
  });
  delete require.cache[helperPath];
  global.hexo = previousHexo;
});
