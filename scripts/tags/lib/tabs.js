/**
 * tabs.js | https://theme-next.js.org/docs/tag-plugins/tabs
 */

'use strict';

module.exports = ctx => function(args, content) {
  const tabBlock = /<!--\s*tab (.*?)\s*-->\n([\w\W\s\S]*?)<!--\s*endtab\s*-->/g;
  args = ctx.args.map(args, ['active', 'codeblock', 'color'], ['tabName']);
  const tabName = args.tabName;
  const tabActive = Number(args.active) || 0;

  let match;
  let tabId = 0;
  let tabNav = '';
  let tabContent = '';

  if (!tabName) ctx.log.warn('Tabs block must have unique name!');

  while ((match = tabBlock.exec(content)) !== null) {
    let {caption, codeblock} = ctx.args.map(match[1].split(' '), ['codeblock'], ['caption']);
    let postContent = ctx.render.renderSync({ text: match[2], engine: 'markdown' }).trim();

    const abbr = tabName + ' ' + ++tabId;
    const href = abbr.toLowerCase().split(' ').join('-');

    const isActive = (tabActive > 0 && tabActive === tabId) || (tabActive === 0 && tabId === 1) ? ' active' : '';
    tabNav += `<li class="tab${isActive}"><a href="#${href}">${caption || abbr}</a></li>`;
    tabContent += `<div class="tab-pane${isActive}" ${codeblock ? 'codeblock="true"' : ''} id="${href}">${postContent}</div>`;
  }

  tabNav = `<ul class="nav-tabs">${tabNav}</ul>`;
  tabContent = `<div class="tab-content fs14">${tabContent}</div>`;

  return `<div class="tag-plugin tabs" id="${tabName.toLowerCase().split(' ').join('-')}">${tabNav + tabContent}</div>`;
};
