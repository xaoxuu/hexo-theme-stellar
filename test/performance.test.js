/* global hexo */
"use strict";

const { test } = require("node:test");
const assert = require("node:assert/strict");

const { moduleImports } = require("../ci/check-performance");

test("性能口径只递归静态 import，不把 dynamic import 计入核心集合", () => {
  const source = [
    "import './side-effect.mjs';",
    "import { value } from './static.mjs';",
    "const lazy = import('./selector-only.mjs');",
    "const versioned = import(`./runtime.mjs${query}`);"
  ].join("\n");
  assert.deepEqual(moduleImports(source), ["./side-effect.mjs", "./static.mjs"]);
});
