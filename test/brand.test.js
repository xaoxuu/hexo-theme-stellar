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
    image: { src: '/project.svg', style: 'icon' },
    name: 'Project',
    tagline: 'Tagline',
    url: '/wiki/project/'
  });
  assert.deepStrictEqual(automaticCollectionBrand({ ...base, routing: { path: '/topic/project/' } }, 'topic'), {});
  assert.equal(automaticCollectionBrand({ ...base, routing: { base_dir: 'notes/project' } }, 'notebook').url, 'notes/project');
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
    routing: { path: '/topic/collection/' },
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
    themeBrand: {
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
    image: { src: '/collection.svg', style: 'plain' },
    name: 'Page',
    tagline: 'Collection override',
    url: '/'
  });
  assert.deepStrictEqual(resolveBrand({
    themeBrand: { image: { src: '/site.svg', style: 'avatar' }, name: 'Site' },
    pageBrand: { tagline: 'Page' }
  }), {
    image: { src: '/site.svg', style: 'avatar' },
    name: 'Site',
    tagline: 'Page'
  });
  assert.deepStrictEqual(resolveBrand({
    themeBrand: { tagline: 'Site fallback', url: '/' },
    collection: { name: 'Collection', identity: { icon: '/auto.svg' } },
    collectionType: 'wiki'
  }), {
    image: { src: '/auto.svg', style: 'icon' },
    name: 'Collection',
    tagline: 'Site fallback',
    url: '/'
  });
});

test('Topic 默认完整继承全局 Brand，只有显式 Brand 才覆盖', () => {
  const themeBrand = {
    image: { src: '/site.svg', style: 'avatar' },
    name: 'Site',
    tagline: 'Site tagline',
    url: '/'
  };
  const topic = {
    name: 'Topic',
    tagline: 'Topic tagline',
    identity: { icon: '/topic.svg' },
    routing: { path: '/topic/example/' }
  };
  assert.deepStrictEqual(resolveBrand({
    themeBrand,
    collection: topic,
    collectionType: 'topic',
    defaultIcon: '/default.svg'
  }), themeBrand);

  topic.sidebar = { left: { brand: { name: 'Custom Topic' } } };
  assert.deepStrictEqual(resolveBrand({
    themeBrand,
    collection: topic,
    collectionType: 'topic',
    defaultIcon: '/default.svg'
  }), {
    ...themeBrand,
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
