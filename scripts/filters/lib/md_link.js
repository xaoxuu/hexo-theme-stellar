'use strict';

const cheerio = require('cheerio');
const { resolveServiceProvider } = require('../../lib/service-provider');

module.exports.processPost = function(data) {
  if (typeof data.content !== 'string' || !data.content.includes('<a')) return data;
  const endpoint = resolveServiceProvider(this.stellar.config.services.siteInfo)?.endpoint;
  const $ = cheerio.load(data.content, null, false);
  $('a[href]').each((index, node) => {
    const link = $(node);
    const href = link.attr('href').trim();
    if (!href || href.startsWith('#') || link.attr('class') || link.attr('role') ||
        link.is('[cardlink], [data-md-link], [data-siteinfo-api]') ||
        link.closest('pre, code, .highlight, .footnotes').length ||
        link.find('img, svg').length || !link.text().trim()) return;
    let url;
    try { url = new URL(href, this.config.url); } catch { return; }
    if (!['http:', 'https:'].includes(url.protocol)) return;
    link.attr('data-md-link', '');
    link.prepend(`<span class="md-link-icon ui-icon" aria-hidden="true">${this.utils.icon('default:link', '', true)}</span>`);
    if (endpoint) link.attr('data-siteinfo-api', endpoint.replace('{href}', encodeURIComponent(url.href)));
  });
  data.content = $.html();
  return data;
};
