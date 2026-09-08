/* global hexo */
"use strict";

const { test } = require("node:test");
const assert = require("node:assert/strict");

const { moduleImports } = require("../ci/check-performance");

test("性能清单区分静态和可达动态导入，包括带版本的模板字符串", () => {
  const source = [
    "import './side-effect.js';",
    "import { value } from './static.js';",
    "const lazy = import('./selector-only.js');",
    "const versioned = import(`./runtime.js${query}`);"
  ].join("\n");
  assert.deepEqual(moduleImports(source), ["./side-effect.js", "./static.js"]);
  assert.deepEqual(moduleImports(source, "dynamic"), ["./selector-only.js", "./runtime.js"]);
});
