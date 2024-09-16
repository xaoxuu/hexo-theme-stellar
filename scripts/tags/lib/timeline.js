/**
 * timeline.js v2.1 | https://github.com/xaoxuu/hexo-theme-stellar/
 *
 * {% timeline %}
 *
 * <!-- node header1 -->
 * what happened 1
 *
 * <!-- node header2 -->
 * what happened 2
 *
 * {% endtimeline %}
 */

'use strict'

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

function layoutNodeTitle(ctx, content) {
  var el = ''
  el += '<div class="header">'
  if (content && content.length > 0) {
    el += content
  }
  el += '</div>'
  return el
}

function layoutNodeContent(ctx, content) {
  var el = ''
  el += '<div class="body fs14">'
  if (content && content.length > 0) {
    el += ctx.render.renderSync({text: content, engine: 'markdown'}).split('\n').join('')
  }
  el += '</div>'
  return el
}

function getCurrentTimestamp() {
  return new Date().toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  });
}
function getOrCreateTimestamp(content, ctx) {
  const timestampFile = path.join(ctx.base_dir, 'timeline_timestamps.json');
  let timestamps = {};
  if (fs.existsSync(timestampFile)) {
    timestamps = JSON.parse(fs.readFileSync(timestampFile, 'utf8'));
  }

  const hash = crypto.createHash('md5').update(content).digest('hex');
  if (!timestamps[hash]) {
    timestamps[hash] = getCurrentTimestamp();
    fs.writeFileSync(timestampFile, JSON.stringify(timestamps, null, 2));
  }

  return timestamps[hash];
}

module.exports = ctx => function(args, content = '') {
  args = ctx.args.map(args, ['api', 'user', 'type', 'limit', 'hide', 'avatar'])
  var el = ''
  if (!args.type) {
    args.type = 'timeline'
  }
  if (args.api && args.api.length > 0) {
    el += `<div class="tag-plugin timeline ds-${args.type}"`
    el += ' ' + ctx.args.joinTags(args, ['api', 'user', 'limit', 'hide', 'avatar']).join(' ')
    el += '>'
  } else {
    el += '<div class="tag-plugin timeline">'
  }

  var arr = content.split(/<!--\s*node(.*?)\s*-->/g)
  if (arr.length > 0) {
    var nodes = []
    for (let i = 1; i < arr.length; i += 2) {
      let header = arr[i].trim();
      let body = arr[i + 1] ? arr[i + 1].trim() : '';
      nodes.push({
        header: header || getOrCreateTimestamp(body, ctx),
        body: body
      })
    }
    nodes.forEach((node, i) => {
      el += '<div class="timenode" index="' + (i) + '">'
      el += layoutNodeTitle(ctx, node.header)
      el += layoutNodeContent(ctx, node.body)
      el += '</div>'
    })  
  }

  el += '</div>'
  return el
}