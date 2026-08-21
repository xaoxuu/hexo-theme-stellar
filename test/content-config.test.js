'use strict';

const { test } = require('node:test');
const assert = require('node:assert/strict');

const {
  ContentConfigError,
  getCollectionId,
  isListed,
  isSearchable,
  validateCollectionConfig,
  validateGalaxyOptions,
  validatePageConfig,
  validateThemeConfig
} = require('../scripts/lib/content-config');

test('Galaxy options 保持 React Bits camelCase', () => {
  const issues = validateGalaxyOptions({
    starSpeed: 0.5,
    hueShift: 140,
    mouseInteraction: true,
    disableAnimation: false
  }, 'wiki/stellar.yml', 'hero.background.effect.options');
  assert.deepStrictEqual(issues, []);
});

test('Galaxy options 拒绝 snake_case 别名和错误类型', () => {
  const issues = validateGalaxyOptions({
    star_speed: 0.5,
    mouseInteraction: 'yes'
  }, 'wiki/stellar.yml', 'hero.background.effect.options');
  assert.match(issues.join('\n'), /star_speed/);
  assert.match(issues.join('\n'), /mouseInteraction 应为 boolean/);
});

test('集合配置拒绝 v1 字段并包含来源', () => {
  assert.throws(() => validateCollectionConfig({
    name: 'Stellar',
    cover: '/cover.webp'
  }, 'source/_data/wiki/hexo-stellar.yml'), error => {
    assert.ok(error instanceof ContentConfigError);
    assert.match(error.message, /source\/_data\/wiki\/hexo-stellar\.yml: v1 字段 cover 已移除/);
    return true;
  });
});

test('sidebar.left/right 只接受 widgets 数组', () => {
  assert.throws(() => validateCollectionConfig({
    name: 'Stellar',
    sidebar: {
      left: { widgets: 'tree, toc' },
      right: { widgets: ['toc'] }
    }
  }), /sidebar\.left\.widgets 应为 widget\[\]/);
});

test('Brand 接受三种图片样式和显式背景', () => {
  assert.doesNotThrow(() => validateThemeConfig({
    brand: {
      image: {
        src: '/avatar.webp',
        style: 'avatar',
        url: '/about/',
        background: 'var(--block)'
      },
      name: 'Stellar',
      tagline: 'Blog',
      url: '/'
    }
  }, '_config.stellar.yml'));
  for (const style of ['avatar', 'icon', 'plain']) {
    assert.doesNotThrow(() => validatePageConfig({
      sidebar: { left: { brand: { image: { src: '/brand.svg', style } } } }
    }));
  }
});

test('Brand 拒绝不完整图片、非法样式和 plain 背景', () => {
  assert.throws(() => validatePageConfig({
    sidebar: { left: { brand: { image: { style: 'icon' } } } }
  }), /brand\.image\.src/);
  assert.throws(() => validatePageConfig({
    sidebar: { left: { brand: { image: { src: '/brand.svg' } } } }
  }), /brand\.image\.style/);
  assert.throws(() => validatePageConfig({
    sidebar: { left: { brand: { image: { src: '/brand.svg', style: 'square' } } } }
  }), /必须是 avatar、icon 或 plain/);
  assert.throws(() => validatePageConfig({
    sidebar: { left: { brand: { image: { src: '/brand.svg', style: 'plain', background: '#fff' } } } }
  }), /plain 时不能配置 background/);
});

test('Brand 和 mobile_header 旧写法给出迁移错误', () => {
  assert.throws(() => validateThemeConfig({ logo: { name: 'Stellar' } }, '_config.stellar.yml'), /根字段 logo 已移除，请使用 brand/);
  assert.throws(() => validatePageConfig({
    sidebar: { left: { logo: { name: 'Page' } } }
  }, 'source/page.md'), /sidebar\.left\.logo 已移除，请使用 sidebar\.left\.brand/);
  assert.throws(() => validatePageConfig({
    sidebar: { left: { brand: { avatar: '/avatar.webp' } } }
  }, 'source/page.md'), /brand\.avatar 已移除/);
  assert.throws(() => validatePageConfig({
    navigation: { mobile_header: false }
  }, 'source/page.md'), /mobile_header 已移除，手机端 Brand 由页面类型自动决定/);
});

test('Brand 拒绝 Markdown 链接编码', () => {
  assert.throws(() => validatePageConfig({
    sidebar: { left: { brand: { name: '[Page](/page/)' } } }
  }), /brand\.name 不再解析 Markdown 链接/);
  assert.throws(() => validatePageConfig({
    sidebar: { left: { brand: { image: { src: '[\/avatar.webp](/about/)', style: 'avatar' } } } }
  }), /brand\.image\.src 不再解析 Markdown 链接/);
});

test('页面 collection 与 visibility 接受严格 v2 结构', () => {
  assert.doesNotThrow(() => validatePageConfig({
    collection: { type: 'wiki', id: 'stellar' },
    sidebar: {
      left: { widgets: ['tree'] },
      right: { widgets: ['toc'] }
    },
    visibility: { listed: true, searchable: false }
  }, 'source/wiki/stellar/index.md'));
});

test('页面拒绝旧 collection 与 indexing 字段', () => {
  assert.throws(() => validatePageConfig({
    wiki: 'stellar',
    indexing: false
  }, 'source/wiki/stellar/index.md'), error => {
    assert.match(error.message, /v1 字段 wiki 已移除/);
    assert.match(error.message, /v1 字段 indexing 已移除/);
    return true;
  });
});

test('页面与集合拒绝未知 Stellar 字段', () => {
  assert.throws(() => validateCollectionConfig({name: 'Stellar', mystery: true}), /root\.mystery/);
  assert.throws(() => validatePageConfig({title: '页面', mystery: true}), /root\.mystery/);
});

test('listing.priority 拒绝负数和非有限数值', () => {
  assert.throws(() => validateCollectionConfig({
    name: 'Stellar',
    listing: { priority: -1 }
  }), /listing\.priority 不能小于 0/);
  assert.throws(() => validatePageConfig({
    title: '页面',
    listing: { priority: Number.POSITIVE_INFINITY }
  }), /listing\.priority 应为 finite number/);
});

test('getCollectionId 只返回匹配类型的集合 id', () => {
  const page = { collection: { type: 'wiki', id: 'stellar' } };
  assert.equal(getCollectionId(page, 'wiki'), 'stellar');
  assert.equal(getCollectionId(page, 'topic'), null);
  assert.equal(getCollectionId({}, 'wiki'), null);
});

test('visibility 的 listed 和 searchable 彼此独立', () => {
  assert.equal(isListed({ visibility: { listed: false, searchable: true } }), false);
  assert.equal(isSearchable({ visibility: { listed: false, searchable: true } }), true);
  assert.equal(isListed({ visibility: { listed: true, searchable: false } }), true);
  assert.equal(isSearchable({ visibility: { listed: true, searchable: false } }), false);
  assert.equal(isListed({}), true);
  assert.equal(isSearchable({}), true);
});
