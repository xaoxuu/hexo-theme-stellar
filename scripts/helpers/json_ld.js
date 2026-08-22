/**
 * Builds JSON-LD structured data for current page according to its type (page or post).
 *
 * @returns {string} - JSON-LD structured data
 */
'use strict';

const util = require('hexo-util');
const { postImages, postDescription } = require('../lib/seo');
const { getCollectionId } = require('../lib/content-config');

hexo.extend.helper.register('json_ld', function(args) {
  if (args?.collection?.profile === 'post') {
    if (!args.render?.seo?.jsonLd) {
      throw new Error(`Stellar v2: 普通 Post ${args.item?.source?.file || '<unknown>'} 缺少 render.seo.jsonLd`);
    }
    return `<script type="application/ld+json">${JSON.stringify(args.render.seo.jsonLd)}</script>`;
  }
  const page = this.page;
  const config = this.config;
  const structuredData = this.stellar_config("seo.structuredData");
  const authorEmail = config.email;
  let authorImage = config.avatar || (authorEmail ? this.gravatar(authorEmail) : null);
  const isPage = page.layout == 'page';
  if (authorImage && authorImage.startsWith("/")) {
    authorImage = config.url.endsWith("/") ? config.url + authorImage.slice(1) : config.url + authorImage
  }

  const author = {
    '@type': 'Person',
    name: config.author,
    sameAs: structuredData.sameAs
  };
  // Google does not accept `Person` as item type for the publisher property
  const publisher = Object.assign({}, author, {'@type': 'Organization'});
  let schema = {};

  if (authorImage) {
    author.image = authorImage;
    publisher.image = authorImage;
    publisher.logo = {
      '@type': 'ImageObject',
      url: authorImage
    };
  }

  if (this.is_post()) {
    const images = postImages({
      cardCover: page.card?.cover,
      bannerImage: page.banner?.image,
      photos: page.photos,
      content: page.content,
      defaultCover: this.theme.default && this.theme.default.cover
    });
    schema = {
      '@context': 'https://schema.org',
      '@type': 'BlogPosting',
      author: author,
      // articleBody: this.strip_html(page.content),
      dateCreated: page.date.format(),
      dateModified: page.updated.format(),
      datePublished: page.date.format(),
      description: postDescription({ excerpt: page.excerpt, content: page.content }),
      headline: page.title,
      mainEntityOfPage: {
        '@type': 'WebPage',
        '@id': this.pretty_url(page.permalink)
      },
      publisher,
      url: this.pretty_url(page.permalink)
    };

    if (page.tags && page.tags.length > 0) {
      schema.keywords = page.tags.map((tag) => tag.name).join(', ');
    }

    schema.thumbnailUrl = images[0] || undefined;
    schema.image = images;

  } else if (isPage || this.is_home()) {

    // 首页 URL 归一为带尾斜杠形式，与 canonical 保持一致
    const url = this.is_home() ? config.url.replace(/\/?$/, '/') : this.pretty_url(page.permalink);
    schema = {
      '@context': 'https://schema.org',
      '@type': 'Website',
      '@id': url,
      author: author,
      name: page.title || config.title,
      description: config.description,
      url: url
    };

    if (config.keywords && config.keywords.length) {
      if (Array.isArray(args)) {
        schema.keywords = config.keywords.join(', ');
      } else {
        schema.keywords = config.keywords;
      }
    }
    if (!this.is_home()) {

      if (page.excerpt || page.description) {
        schema.description = this.strip_html(page.description || page.excerpt);
      } else if (getCollectionId(page, 'wiki')) {
        const proj = this.theme.wiki.tree[getCollectionId(page, 'wiki')];
        if (proj && proj.description) {
          schema.description = proj.description;
        }
      } else {
        schema.description = util.truncate(this.strip_html(page.content), {length: 200});
      }

    }

  } else {

    // default to WebPage for other layouts
    schema = {
      '@context': 'https://schema.org',
      '@type': 'Website',
      '@id': config.url,
      author: author,
      name: config.title,
      description: config.description,
      url: config.url
    };

  }

  return `<script type="application/ld+json">${JSON.stringify(schema)}</script>`;
});
