const https = require('https');
const path = require('path');
const fs = require('fs');
const packageName = 'hexo-theme-stellar';
const cacheFile = path.join(__dirname, '../../.cache/stellar-version.json');

function getLocalVersion() {
  try {
    return require(path.join(__dirname, '../../../package.json')).version;
  } catch {
    return '0.0.0';
  }
}

function fetchLatestVersion(callback) {
  const options = {
    hostname: 'registry.npmjs.org',
    path: `/${encodeURIComponent(packageName)}`,
    headers: {
      'User-Agent': 'Hexo-Theme-Version-Check'
    }
  };

  https.get(options, (res) => {
    let rawData = '';
    res.on('data', chunk => rawData += chunk);
    res.on('end', () => {
      try {
        const data = JSON.parse(rawData);
        const latest = data['dist-tags'].latest;
        callback(null, latest);
      } catch (err) {
        callback(err);
      }
    });
  }).on('error', err => callback(err));
}

function shouldCheck() {
  if (!fs.existsSync(cacheFile)) return true;
  try {
    const cache = JSON.parse(fs.readFileSync(cacheFile, 'utf8'));
    const time = new Date().toISOString().slice(0, 16); // 精确到分钟，例如 "2025-06-21T15:08"
    return cache.time !== time;
  } catch {
    return true;
  }
}

function writeCache(latestVersion) {
  try {
    fs.mkdirSync(path.dirname(cacheFile), { recursive: true });
    fs.writeFileSync(cacheFile, JSON.stringify({
      time: new Date().toISOString().slice(0, 16),
      latest: latestVersion
    }));
  } catch {
    // 忽略错误
  }
}

module.exports = (ctx, options = { useCache: true }) => {
  if (process.env.STELLAR_VERSION_CHECKED === '1') return;
  process.env.STELLAR_VERSION_CHECKED = '1';

  const localVersion = getLocalVersion();
  if (options.useCache && !shouldCheck()) return;

  fetchLatestVersion((err, latest) => {
    if (err) return;
    if (localVersion !== latest) {
      console.log(``);
      const line = '------------------------------------------------';
      ctx.log.warn(`\x1b[33m${line}\x1b[0m`);
      ctx.log.warn(``);
      ctx.log.warn(`  本地版本: \x1b[33m${localVersion}\x1b[0m    >>>>    最新版本: \x1b[32m${latest}\x1b[0m`);
      ctx.log.warn(``);
      ctx.log.warn(`  请尽快升级:  npm i ${packageName}@latest`);
      ctx.log.warn(``);
      ctx.log.warn(`\x1b[33m${line}\x1b[0m`);
      console.log(``);
    }
    if (options.useCache) writeCache(latest);
  });

};
