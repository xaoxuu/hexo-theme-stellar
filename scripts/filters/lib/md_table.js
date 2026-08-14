/**
 * md_table.js v1 | https://github.com/xaoxuu/hexo-theme-stellar/
 * 普通 Markdown 表格包一层 .md-table-scroll 横向滚动容器，
 * 宽度足够时铺满容器，内容超出容器宽度时横向滚动。
 */

'use strict';

const cheerio = require('cheerio');

/**
 * 将内容中的普通 `<table>` 包一层 `.md-table-scroll` 容器。
 * 排除代码高亮表格（.highlight）与 {% table %} 标签容器（.tag-plugin.table）。
 */
function wrapMdTables(htmlContent) {
  const $ = cheerio.load(htmlContent, null, false);
  $('table').each(function () {
    const $table = $(this);
    if ($table.parent().is('.md-table-scroll')) {
      return;
    }
    if ($table.closest('.highlight').length) {
      return;
    }
    if ($table.closest('.tag-plugin.table').length) {
      return;
    }
    $table.wrap('<div class="md-table-scroll"></div>');
  });
  return $.html();
}

module.exports.wrapMdTables = wrapMdTables;

function processPost(data) {
  if (data.content) {
    data.content = wrapMdTables(data.content);
  }
  return data;
}

module.exports.processPost = processPost;
