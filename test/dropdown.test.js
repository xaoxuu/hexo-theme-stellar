'use strict';

const { test } = require('node:test');
const assert = require('node:assert/strict');

const applyThemeUtils = require('../scripts/events/lib/utils.js');

function createDropdownTag() {
  const fakeHexo = {
    theme: {
      config: {
        icons: {
          'default:documents': '<svg></svg>',
          'default:github': '<svg></svg>'
        }
      }
    },
    config: { root: '/', url: 'https://example.com' }
  };
  applyThemeUtils(fakeHexo);
  return require('../scripts/tags/lib/dropdown.js')({
    args: fakeHexo.args,
    config: fakeHexo.config,
    utils: fakeHexo.utils
  });
}

test('dropdown 标签渲染方向、对齐、默认展开和链接属性', () => {
  const tag = createDropdownTag();
  const html = tag(
    ['direction:up', 'align:right', 'open:true', '更多链接'],
    '- icon:default:documents [文档](/wiki/)\n- icon:default:github [GitHub](https://github.com/)'
  );

  assert.match(html, /<details class="tag-plugin dropdown" direction="up" align="right" open>/);
  assert.match(html, /<summary class="dropdown-trigger" title="更多链接" aria-label="更多链接">/);
  assert.match(html, /<svg class="dropdown-arrow" viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M6 9l6 6 6-6" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"\/><\/svg>/);
  assert.match(html, /href="&#x2F;wiki&#x2F;" rel="noopener noreferrer"/);
  assert.match(html, /href="https:&#x2F;&#x2F;github\.com&#x2F;" target="_blank" rel="external nofollow noopener noreferrer"/);
});

test('dropdown 标签转义标题和链接属性，忽略无图标子项', () => {
  const tag = createDropdownTag();
  const html = tag(
    ['更多'],
    '- icon:default:documents [A & B](/a?x=1&y=2)\n- [无图标](/skip/)'
  );

  assert.match(html, /<span>A &amp; B<\/span>/);
  assert.match(html, /href="&#x2F;a\?x&#x3D;1&amp;y&#x3D;2"/);
  assert.doesNotMatch(html, /无图标/);
});

test('dropdown 标签未指定方向时交给运行时自动判断', () => {
  const tag = createDropdownTag();
  const html = tag(
    ['更多'],
    '- icon:default:documents [文档](/wiki/)'
  );

  assert.match(html, /<details class="tag-plugin dropdown" direction="auto" align="auto">/);
});

test('dropdown 标签不使用居中默认对齐', () => {
  const tag = createDropdownTag();
  const html = tag(
    ['align:center', '更多'],
    '- icon:default:documents [文档](/wiki/)'
  );

  assert.match(html, /<details class="tag-plugin dropdown" direction="auto" align="auto">/);
});

test('dropdown 标签兼容旧 icon 参数，缺少标题或有效子项时不渲染', () => {
  const tag = createDropdownTag();
  assert.match(tag(['icon:default:documents', '更多'], '- icon:default:documents [文档](/wiki/)'), /dropdown-arrow/);
  assert.equal(tag([], '- icon:default:documents [文档](/wiki/)'), '');
  assert.equal(tag(['更多'], '- [文档](/wiki/)'), '');
});
