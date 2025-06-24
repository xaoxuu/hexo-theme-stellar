const fs = require('fs');
const path = require('path');
const glob = require('glob');

module.exports = (ctx, options) => {
  const mdFiles = glob.sync('source/**/*.md');

  const ratioMapPath = path.join(__dirname, '../../.cache/image-ratios.json');
  if (!fs.existsSync(ratioMapPath)) {
    return;
  }
  const ratioMap = JSON.parse(fs.readFileSync(ratioMapPath));

  mdFiles.forEach(file => {
    let content = fs.readFileSync(file, 'utf8');
    let modified = false;
    const relativePath = path.relative(process.cwd(), file);
    const fileRatios = ratioMap[relativePath];
    if (!fileRatios) {
      return;
    }
    content = content.replace(
      /{%\s+image\s+([^\n%]*?)\b(https?:\/\/[^\s%]+)\b([^\n%]*?)%}/g,
      (match, before, url, after) => {
        if (match.includes('ratio:')) return match;

        const ratio = fileRatios?.[url];
        if (!ratio) return match;
        modified = true;
        const beforeTrim = before ? before.trim() : '';
        if (beforeTrim.length > 0) {
          return `{% image ${before.trim()} ${url} ${after.trim()} ratio:${ratio} %}`;
        } else {
          return `{% image ${url} ${after.trim()} ratio:${ratio} %}`;
        }
      }
    );

    if (modified) {
      fs.writeFileSync(file, content, 'utf8');
    }
  });
  ctx.log.info('{% image %} 标签的图片长宽比已固定！');
};
