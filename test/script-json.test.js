'use strict';
const { test } = require('node:test');
const assert = require('node:assert/strict');
const vm = require('node:vm');
const { load } = require('cheerio');
const { scriptJson } = require('../scripts/lib/script-json');

test('Script data round-trips arbitrary text without executing it or closing its element', () => {
  const value = { text: '"\'` ${globalThis.executed=true}\n</script><script>executed=true</script>&\u2028\u2029' };
  const serialized = scriptJson(value);
  const html = `<script>globalThis.data=${serialized}</script>`;
  const $ = load(html);
  assert.equal($('script').length, 1);
  const sandbox = {};
  vm.runInNewContext($('script').text(), sandbox);
  assert.equal(sandbox.executed, undefined);
  assert.equal(sandbox.data.text, value.text);
  assert.deepEqual(JSON.parse(serialized), value);
});
