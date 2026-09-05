/**
 * {% gist owner/id [file:name] %}
 */

'use strict'

module.exports = ctx => function(args) {
  args = ctx.args.map(args, ['file'], ['gist'])
  const gist = args.gist
  if (typeof gist !== 'string' || !/^[A-Za-z0-9_.-]+\/[A-Za-z0-9]+$/.test(gist)) {
    throw new Error('[stellar tag:gist] expected owner/id')
  }
  const base = ctx.stellar.config.services.github.gistUrl.replace(/\/+$/, '')
  const query = args.file ? `?file=${encodeURIComponent(args.file)}` : ''
  return `<script src="${base}/${gist}.js${query}"></script>`
}
