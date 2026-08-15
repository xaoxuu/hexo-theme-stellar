/**
 * notebooks.js v1
 *
 * 笔记本系统构建入口：委托 scripts/lib/notebooks.js 的纯函数，
 * 保持 ctx.theme.config.notebooks 输出结构与旧实现一致。
 */

'use strict';

const { getNotebooksObject } = require('../../lib/notebooks');

module.exports = ctx => {
  const notebooks = getNotebooksObject(ctx);
  ctx.theme.config.notebooks = notebooks;
};
