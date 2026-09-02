/* global hexo */
"use strict";

const { test } = require("node:test");
const assert = require("node:assert/strict");

const { moduleImports } = require("../ci/check-performance");

test("性能口径只递归静态 import，不把 dynamic import 计入核心集合", () => {
  const source = [
    "import './side-effect.js';",
    "import { value } from './static.js';",
    "const lazy = import('./selector-only.js');",
    "const versioned = import(`./runtime.js${query}`);"
  ].join("\n");
  assert.deepEqual(moduleImports(source), ["./side-effect.js", "./static.js"]);
});
