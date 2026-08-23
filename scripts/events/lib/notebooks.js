/**
 * notebooks.js v1
 *
 * 笔记本系统构建入口：委托 scripts/lib/notebooks.js 的纯函数，
 * 将 Notebook 运行时树写入 ctx.stellar.data.notebooks。
 */

"use strict";

const { getNotebooksObject } = require("../../lib/notebooks");
const { ensureRuntimeData } = require("../../lib/runtime-data");

module.exports = ctx => {
  const notebooks = getNotebooksObject(ctx);
  ensureRuntimeData(ctx).notebooks = notebooks;
};
