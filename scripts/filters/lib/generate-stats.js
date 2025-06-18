const fs = require('fs');
const path = require('path');
const moment = require('moment');

function generateStats(hexo) {
  const posts = hexo.locals.get('posts');

  const monthlyCount = {};
  const tagCount = {};
  const categoryCount = {};

  posts.forEach(post => {
    const month = moment(post.date).format('YYYY-MM');
    monthlyCount[month] = (monthlyCount[month] || 0) + 1;

    post.tags.data.forEach(tag => {
      tagCount[tag.name] = (tagCount[tag.name] || 0) + 1;
    });

    post.categories.data.forEach(category => {
      categoryCount[category.name] = (categoryCount[category.name] || 0) + 1;
    });
  });

  const sortedMonthlyCount = Object.fromEntries(
    Object.entries(monthlyCount)
      .sort((a, b) => a[0].localeCompare(b[0])) // 按键（即月份）排序
  );

  const topTags = Object.entries(tagCount)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8)
    .map(([name, count]) => ({ name, count }));

  const topCategories = Object.entries(categoryCount)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([name, count]) => ({ name, count }));

  const data = {
    monthlyCount: sortedMonthlyCount,
    topTags,
    topCategories
  };
  const isDevelopment = hexo.env.cmd === 'server';
  const outputDir = isDevelopment ? hexo.source_dir : hexo.public_dir;
  const outputPath = path.join(outputDir, 'stats.json');
  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  fs.writeFileSync(outputPath, JSON.stringify(data, null, 2));
}

module.exports = { generateStats };
