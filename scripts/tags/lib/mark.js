/**
 * mark.js | 基于Next https://theme-next.js.org/docs/tag-plugins/label
 */

'use strict';

module.exports = ctx => function(args) {
  const [classes = 'default', text = ''] = args.join(' ').split(' ');

  if (!text) ctx.log.warn('mark text must be defined!');

  return `<mark class="mark ${classes.trim()}">${text}</mark>`;
};
