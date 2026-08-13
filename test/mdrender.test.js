'use strict';

const { test } = require('node:test');
const assert = require('node:assert/strict');

const {
  GITHUB_RAW_HOST,
  PLACEHOLDER_CLASS,
  parseGitHubRaw,
  mdrenderHtml
} = require('../scripts/lib/mdrender_html');

const {
  readmeUrl,
  isEmptyContent,
  isWikiReadmePage,
  wikiReadmeHtml
} = require('../scripts/lib/wiki_readme');

const { slugifyHeading } = require('../source/js/services/mdrender.js');

const applyThemeUtils = require('../scripts/events/lib/utils.js');

function createMdTag() {
  const fakeHexo = {};
  applyThemeUtils(fakeHexo);
  const ctx = {
    theme: { config: { api_host: { ghraw: 'raw.github.xaox.cc' } } },
    args: fakeHexo.args
  };
  return require('../scripts/tags/lib/md.js')(ctx);
}

// ---------- 底层通用组件 ----------

test('底层组件导出常量', () => {
  assert.equal(GITHUB_RAW_HOST, 'raw.githubusercontent.com');
  assert.equal(PLACEHOLDER_CLASS, 'ds-mdrender');
});

test('mdrenderHtml 默认输出：填充模式 + 标题适配 + id', () => {
  const html = mdrenderHtml('https://example.com/a.md', { id: 'md_1' });
  assert.ok(html.includes('class="data-service ds-mdrender"'));
  assert.ok(html.includes('src="https://example.com/a.md"'));
  assert.ok(html.includes('data-heading="true"'));
  assert.ok(html.includes('id="md_1"'));
  assert.ok(!html.includes('data-replace'));
  assert.ok(!html.includes('data-base'));
});

test('mdrenderHtml replace 模式输出 data-replace', () => {
  const html = mdrenderHtml('https://example.com/a.md', { replace: true });
  assert.ok(html.includes('data-replace="true"'));
});

test('mdrenderHtml heading:false 不输出 data-heading', () => {
  const html = mdrenderHtml('https://example.com/a.md', { heading: false });
  assert.ok(!html.includes('data-heading'));
});

test('mdrenderHtml 传 ghraw 时替换为镜像并输出 data-base', () => {
  const html = mdrenderHtml(
    'https://raw.githubusercontent.com/xaoxuu/star-vote/HEAD/README.md',
    { ghraw: 'raw.github.xaox.cc', replace: true }
  );
  assert.ok(html.includes('src="https://raw.github.xaox.cc/xaoxuu/star-vote/HEAD/README.md"'));
  assert.ok(html.includes('data-base="https://raw.github.xaox.cc/xaoxuu/star-vote/HEAD/"'));
  assert.ok(html.includes('data-replace="true"'));
});

test('mdrenderHtml 未传 ghraw 时保留 src 原 host，不硬编码默认值', () => {
  const html = mdrenderHtml('https://raw.githubusercontent.com/xaoxuu/a/main/b.md');
  assert.ok(html.includes('src="https://raw.githubusercontent.com/xaoxuu/a/main/b.md"'));
  assert.ok(html.includes('data-base="https://raw.githubusercontent.com/xaoxuu/a/main/"'));
});

test('mdrenderHtml 非 GitHub src 原样输出、无 data-base', () => {
  const html = mdrenderHtml('https://gcore.jsdelivr.net/gh/xaoxuu/hexo-theme-stellar/README.md');
  assert.ok(html.includes('src="https://gcore.jsdelivr.net/gh/xaoxuu/hexo-theme-stellar/README.md"'));
  assert.ok(!html.includes('data-base'));
});

test('parseGitHubRaw 解析 host/owner/repo/ref/rest', () => {
  const parsed = parseGitHubRaw('https://raw.githubusercontent.com/xaoxuu/star-vote/main/docs/a.md');
  assert.deepEqual(parsed, {
    host: 'raw.githubusercontent.com',
    owner: 'xaoxuu',
    repo: 'star-vote',
    ref: 'main',
    rest: 'docs/a.md'
  });
});

test('parseGitHubRaw 非 GitHub 或非法地址返回 null', () => {
  assert.equal(parseGitHubRaw('https://example.com/a.md'), null);
  assert.equal(parseGitHubRaw(''), null);
  assert.equal(parseGitHubRaw('not a url'), null);
});

// ---------- wiki 应用层 ----------

test('readmeUrl 用配置 host 构造 README 地址，branch 缺省 HEAD', () => {
  assert.equal(
    readmeUrl('xaoxuu/star-vote', undefined, 'raw.github.xaox.cc'),
    'https://raw.github.xaox.cc/xaoxuu/star-vote/HEAD/README.md'
  );
  assert.equal(
    readmeUrl('xaoxuu/star-vote', 'main', 'raw.githubusercontent.com'),
    'https://raw.githubusercontent.com/xaoxuu/star-vote/main/README.md'
  );
});

test('isEmptyContent 剪裁空白后判空', () => {
  assert.equal(isEmptyContent({ content: '' }), true);
  assert.equal(isEmptyContent({ content: '  \n\t ' }), true);
  assert.equal(isEmptyContent({ content: '内容' }), false);
  assert.equal(isEmptyContent({}), true);
});

test('isWikiReadmePage 首页空正文 + repo 触发', () => {
  const proj = { repo: 'xaoxuu/star-vote', homepage: { path: 'wiki/star-vote/index.html' } };
  assert.equal(isWikiReadmePage(proj, { content: '', path: 'wiki/star-vote/index.html' }), true);
  assert.equal(isWikiReadmePage(proj, { content: '  \n  ', path: 'wiki/star-vote/index.html' }), true);
});

test('isWikiReadmePage 非首页/无 repo/正文非空不触发', () => {
  const proj = { repo: 'xaoxuu/star-vote', homepage: { path: 'wiki/star-vote/index.html' } };
  assert.equal(isWikiReadmePage(proj, { content: '', path: 'wiki/star-vote/other.html' }), false);
  assert.equal(
    isWikiReadmePage({ homepage: { path: 'wiki/star-vote/index.html' } }, { content: '', path: 'wiki/star-vote/index.html' }),
    false
  );
  assert.equal(isWikiReadmePage(proj, { content: '有内容', path: 'wiki/star-vote/index.html' }), false);
  assert.equal(isWikiReadmePage(null, { content: '', path: 'wiki/star-vote/index.html' }), false);
});

test('wikiReadmeHtml 不适用时返回空串', () => {
  const proj = { repo: 'xaoxuu/star-vote', homepage: { path: 'wiki/star-vote/index.html' } };
  assert.equal(wikiReadmeHtml(proj, { content: '有内容', path: 'wiki/star-vote/index.html' }, { ghraw: 'raw.github.xaox.cc' }), '');
  assert.equal(wikiReadmeHtml(null, { content: '', path: 'wiki/star-vote/index.html' }), '');
});

test('wikiReadmeHtml 适用时输出镜像 + replace 占位', () => {
  const proj = { repo: 'xaoxuu/star-vote', homepage: { path: 'wiki/star-vote/index.html' } };
  const html = wikiReadmeHtml(proj, { content: '', path: 'wiki/star-vote/index.html' }, { ghraw: 'raw.github.xaox.cc' });
  assert.ok(html.includes('src="https://raw.github.xaox.cc/xaoxuu/star-vote/HEAD/README.md"'));
  assert.ok(html.includes('data-base="https://raw.github.xaox.cc/xaoxuu/star-vote/HEAD/"'));
  assert.ok(html.includes('data-replace="true"'));
  assert.ok(html.includes('data-heading="true"'));
});

// ---------- 客户端 slug 镜像 ----------

test('slugifyHeading 与本地标题 slug 规则一致', () => {
  assert.equal(slugifyHeading('Hello World'), 'hello-world');
  assert.equal(slugifyHeading('  Hello   World!  '), 'hello-world');
  assert.equal(slugifyHeading('A & B (v2)'), 'a-b-v2');
  assert.equal(slugifyHeading('开始使用'), '开始使用');
  assert.equal(slugifyHeading('<code>x</code> 标题'), 'x-标题');
  assert.equal(slugifyHeading('a---b'), 'a-b');
});

// ---------- md 标签 wrap 参数 ----------

test('md 标签默认 wrap 输出填充模式（无 data-replace）', () => {
  const tag = createMdTag();
  const html = tag(['https://example.com/a.md']);
  assert.ok(html.includes('class="data-service ds-mdrender"'));
  assert.ok(html.includes('data-heading="true"'));
  assert.ok(!html.includes('data-replace'));
});

test('md 标签 wrap:false 输出无容器模式（data-replace）', () => {
  const tag = createMdTag();
  const html = tag(['https://example.com/a.md', 'wrap:false']);
  assert.ok(html.includes('data-replace="true"'));
});

test('md 标签 wrap:true 显式开启时仍为填充模式', () => {
  const tag = createMdTag();
  const html = tag(['https://example.com/a.md', 'wrap:true']);
  assert.ok(!html.includes('data-replace'));
});
