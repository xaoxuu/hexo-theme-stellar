const https = require('https');
const path = require('path');
const fs = require('fs');
const packageName = 'hexo-theme-stellar';
const cacheFile = path.join(__dirname, '../../.cache/stellar-version.json');

function parseVersion(version) {
  const match = String(version).trim().match(/^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)(?:-([0-9A-Za-z-]+(?:\.[0-9A-Za-z-]+)*))?(?:\+[0-9A-Za-z-]+(?:\.[0-9A-Za-z-]+)*)?$/);
  if (!match) return null;
  const prerelease = match[4] ? match[4].split('.') : [];
  if (prerelease.some(identifier => /^\d+$/.test(identifier) && identifier.length > 1 && identifier.startsWith('0'))) {
    return null;
  }
  return {
    core: match.slice(1, 4).map(value => BigInt(value)),
    prerelease
  };
}

function comparePrerelease(left, right) {
  if (left.length === 0 || right.length === 0) {
    if (left.length === right.length) return 0;
    return left.length === 0 ? 1 : -1;
  }
  const length = Math.max(left.length, right.length);
  for (let index = 0; index < length; index += 1) {
    if (left[index] == null) return -1;
    if (right[index] == null) return 1;
    const leftNumeric = /^\d+$/.test(left[index]);
    const rightNumeric = /^\d+$/.test(right[index]);
    if (leftNumeric && rightNumeric) {
      const difference = BigInt(left[index]) - BigInt(right[index]);
      if (difference !== 0n) return difference > 0n ? 1 : -1;
    } else if (leftNumeric !== rightNumeric) {
      return leftNumeric ? -1 : 1;
    } else if (left[index] !== right[index]) {
      return left[index] > right[index] ? 1 : -1;
    }
  }
  return 0;
}

function compareVersions(leftVersion, rightVersion) {
  const left = parseVersion(leftVersion);
  const right = parseVersion(rightVersion);
  if (!left || !right) return null;
  for (let index = 0; index < left.core.length; index += 1) {
    if (left.core[index] !== right.core[index]) return left.core[index] > right.core[index] ? 1 : -1;
  }
  return comparePrerelease(left.prerelease, right.prerelease);
}

function shouldNotifyUpgrade(localVersion, latestVersion) {
  return compareVersions(latestVersion, localVersion) > 0;
}

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

function checkVersion(ctx, options = { useCache: true }) {
  if (process.env.STELLAR_VERSION_CHECKED === '1') return;
  process.env.STELLAR_VERSION_CHECKED = '1';

  const localVersion = getLocalVersion();
  if (options.useCache && !shouldCheck()) return;

  fetchLatestVersion((err, latest) => {
    if (err) return;
    if (shouldNotifyUpgrade(localVersion, latest)) {
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

}

module.exports = checkVersion;
module.exports.compareVersions = compareVersions;
module.exports.shouldNotifyUpgrade = shouldNotifyUpgrade;
