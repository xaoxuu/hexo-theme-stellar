const cheerio = require('cheerio');
const probe = require('probe-image-size');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const cachePath = path.join(__dirname, '../../.cache/lazy-height-cache.json');
let cache = fs.existsSync(cachePath) ? JSON.parse(fs.readFileSync(cachePath)) : {};

async function getImageSize(src) {
  const key = crypto.createHash('md5').update(src).digest('hex');
  if (cache[key]) return cache[key];

  try {
    let result;

    if (src.startsWith('http://') || src.startsWith('https://')) {
      result = await probe(src);
    } else {
      const filePath = path.join(process.cwd(), 'source', src);
      const stream = fs.createReadStream(filePath);
      result = await probe(stream);
    }

    const height = result.height;
    const width = result.width;
    const aspectRatio = width / height;
    cache[key] = { height, width, aspectRatio };
    fs.writeFileSync(cachePath, JSON.stringify(cache, null, 2));
    return aspectRatio;
  } catch (err) {
    console.warn(`⚠️ 无法获取图片尺寸: ${src}`);
    return null;
  }
}

hexo.extend.filter.register('after_render:html', async function (html) {
  const fix_ratio = hexo.theme.config.plugins.lazyload.fix_ratio || false;
  if (!fix_ratio) return html;
  
  const $ = cheerio.load(html);
  const wrappers = $('div[lazy-id]');
  const tasks = [];

  wrappers.each(function () {
    const wrapper = $(this);
    const img = wrapper.find('img.lazy');
    const src = img.attr('data-src') || img.attr('src');
    if (!src) return;

    tasks.push(
      getImageSize(src).then(info => {
        if (info) {
          const prev = wrapper.attr('style') || '';
          wrapper.attr('style', `${prev};aspect-ratio:${info.aspectRatio};`);
        }
      })
    );
  });

  await Promise.all(tasks);
  return $.html();
});