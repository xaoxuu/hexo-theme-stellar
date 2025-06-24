const fs = require('fs');
const path = require('path');
const glob = require('glob');
const probe = require('probe-image-size');

const outputPath = path.join(__dirname, '../../.cache/image-ratios.json');

// 读取已有缓存
let cache = fs.existsSync(outputPath)
  ? JSON.parse(fs.readFileSync(outputPath))
  : {};

// 提取 Markdown 中的图片链接
function extractImageUrls(content) {
  const urls = [];
  const tagImgRegex = /{%\s+image\s+[^%]*?\b(https?:\/\/[^\s%]+)[^%]*?%}/g;

  let match;
  while ((match = tagImgRegex.exec(content)) !== null) {
    urls.push(match[1]);
  }

  return urls;
}


// 远程图片尺寸探测
async function getImageRatio(ctx, url) {
  if (!url.startsWith('http')) {
    return null;
  }
  try {
    const result = await probe(url);
    return `${result.width}/${result.height}`;
  } catch (e) {
    ctx.log.warn(`❌ 获取失败: ${url}`, e.message);
    return null;
  }
}


// 主逻辑
module.exports = async (ctx, options) => {
  const cacheExists = fs.existsSync(outputPath);
  if (cacheExists) {
    ctx.log.info('正在获取图片长宽比。缓存已存在，开始增量更新...');
  } else {
    ctx.log.info('正在获取图片长宽比。首次可能耗时较久，请耐心等待...');
  }

  const mdFiles = glob.sync('source/**/*.md');

  for (const file of mdFiles) {
    const relative = path.relative(process.cwd(), file);
    const content = fs.readFileSync(file, 'utf8');
    const imageUrls = extractImageUrls(content);
    const currentUrls = new Set(imageUrls);

    // 初始化或清理旧数据
    if (!cache[relative]) {
      cache[relative] = {};
    } else {
      for (const oldUrl of Object.keys(cache[relative])) {
        if (!currentUrls.has(oldUrl)) {
          delete cache[relative][oldUrl];
        }
      }
    }

    // 探测新图片
    for (const url of imageUrls) {
      if (cache[relative][url]) {
        continue;
      }
      const ratio = await getImageRatio(ctx, url);
      if (ratio) {
        cache[relative][url] = ratio;
        ctx.log.info(`已添加: ${url} → ${ratio}`);

        // 🧠 实时写入（增量更新，支持中断恢复）
        fs.mkdirSync(path.dirname(outputPath), { recursive: true });
        fs.writeFileSync(outputPath, JSON.stringify(cache, null, 2));
      }
    }
  }

  ctx.log.info('[image-ratios.json] 生成完成');
};
