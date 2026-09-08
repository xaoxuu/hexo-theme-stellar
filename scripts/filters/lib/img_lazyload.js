"use strict";
const { mapImageTags, parseImageAttributes, IMAGE_PLACEHOLDER } = require("../../lib/html-images");

function processImgTag(tag, { picture = false } = {}) {
  const end = /\s*\/?\s*>$/.exec(tag)[0];
  const attrs = parseImageAttributes(tag.slice(4, -end.length));
  const get = name => attrs.find(attr => attr.name === name);
  const source = get('data-src') || get('src');
  const native = /^data:image/i.test(source?.value || '') || picture || get('srcset') || get('no-lazy') || get('loading')?.value === 'eager' || get('fetchpriority')?.value === 'high';
  const quote = value => String(value).replace(/"/g, '&quot;').replace(/</g, '&lt;');
  const classes = (get('class')?.value || '').split(/\s+/).filter(value => value && value !== 'lazy');
  function render(skip, extra) {
    return '<img' + attrs.filter(attr => !skip.includes(attr.name)).map(attr => ' ' + attr.raw.replace(/</g, '&lt;')).join('') + extra + end;
  }
  if (native) {
    if (!get('data-src') && !/(^|\s)lazy(\s|$)/.test(get('class')?.value || '')) return tag;
    return render(['src', 'data-src', 'class', 'data-stellar-lazy'],
      (source ? ` src="${quote(source.value)}"` : '') + (classes.length ? ` class="${quote(classes.join(' '))}"` : ''));
  }
  if (!source?.value || /^data:image/i.test(source.value) || get('data-stellar-lazy')) return tag;
  const fallback = render(['src', 'data-src', 'class', 'id', 'onerror'],
    ` src="${quote(source.value)}"` + (classes.length ? ` class="${quote(classes.join(' '))}"` : ''));
  const primary = render(['src', 'data-src', 'class'],
    ` src="${IMAGE_PLACEHOLDER}" data-src="${quote(source.value)}" class="${quote([...classes, 'lazy'].join(' '))}" data-stellar-lazy`);
  // Place fallback first so existing img + loading-icon selectors still work.
  return `<noscript>${fallback}</noscript>${primary}`;
}
function lazyProcess(html) { return mapImageTags(html, processImgTag); }
module.exports = { processImgTag, lazyProcess, processSite: lazyProcess };
