const fs = require('fs');
const path = require('path');
const glob = require('glob');
const probe = require('probe-image-size');

const outputPath = path.join(__dirname, '../../.cache/image-ratios.json');

// 读取已有缓存
let cache = fs.existsSync(outputPath)
  ? JSON.parse(fs.readFileSync(outputPath))
  : {};

// 提取 Markdown 中的图片链接并处理已有 ratio
function extractImageUrlsAndCacheRatio(content, relative, ctx) {
  const urlsToProbe = [];
  const tagImgRegex = /{%\s+image\s+[^%]*?\b(https?:\/\/[^\s%]+)[^%]*?%}/g;

  if (!cache[relative]) cache[relative] = {};

  let match;
  while ((match = tagImgRegex.exec(content)) !== null) {
    const fullTag = match[0];
    const url = match[1];

    // ratio:xxx 或 ratio:xxx/yyy
    const ratioMatch = fullTag.match(/ratio:([0-9./]+)/);
    const ratioStr = ratioMatch ? ratioMatch[1] : null;

    if (cache[relative][url]) {
      // 已有缓存，跳过
      continue;
    }

    if (ratioStr) {
      cache[relative][url] = ratioStr;
      // 🧠 实时写入
      fs.mkdirSync(path.dirname(outputPath), { recursive: true });
      fs.writeFileSync(outputPath, JSON.stringify(cache, null, 2));
    } else {
      urlsToProbe.push(url);
    }
  }

  return urlsToProbe;
}

// 探测远程图片尺寸
async function getImageRatio(ctx, url) {
  if (!url.startsWith('http')) return null;

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
  ctx.log.info(
    cacheExists
      ? '正在获取图片长宽比。缓存已存在，开始增量更新...'
      : '正在获取图片长宽比。首次可能耗时较久，请耐心等待...'
  );

  const mdFiles = glob.sync('source/**/*.md');

  for (const file of mdFiles) {
    const relative = path.relative(process.cwd(), file);
    const content = fs.readFileSync(file, 'utf8');

    // 初始化文件级缓存（提取前先建好结构）
    if (!cache[relative]) {
      cache[relative] = {};
    }

    const imageUrls = extractImageUrlsAndCacheRatio(content, relative, ctx);
    const currentUrls = new Set([
      ...imageUrls,
      ...Object.keys(cache[relative])
    ]);

    // 清理已被 Markdown 中移除的旧记录
    for (const oldUrl of Object.keys(cache[relative])) {
      if (!currentUrls.has(oldUrl)) {
        delete cache[relative][oldUrl];
      }
    }

    // 探测未缓存图片
    for (const url of imageUrls) {
      if (cache[relative][url]) continue;

      const ratio = await getImageRatio(ctx, url);
      if (ratio) {
        cache[relative][url] = ratio;
        ctx.log.info(`✅ 探测添加: ${url} → ${ratio}`);

        // 实时落盘
        fs.mkdirSync(path.dirname(outputPath), { recursive: true });
        fs.writeFileSync(outputPath, JSON.stringify(cache, null, 2));
      }
    }
  }

  ctx.log.info('[image-ratios.json] 生成完成');
};