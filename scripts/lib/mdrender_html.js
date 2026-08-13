/**
 * mdrender_html.js v2 | https://github.com/xaoxuu/hexo-theme-stellar/
 *
 * 远程 Markdown 渲染底层组件（通用能力，不包含应用场景逻辑）：
 * 统一生成 .data-service.ds-mdrender 占位标记。
 *
 * 行为：
 * - src 为 GitHub raw 类地址时，host 替换为调用方传入的 ghraw
 *   （主题配置 api_host.ghraw，代码不设默认值）；未传 ghraw 时保留 src 原 host；
 * - 识别后输出 data-base（该 md 所在 raw 目录）；
 * - 非 GitHub src 原样输出、不带 data-base；
 * - replace=true 输出 data-replace（客户端原地替换，无外部容器）；
 * - heading 缺省 true，输出 data-heading（客户端标题适配本地文章格式）。
 */

'use strict';

// GitHub raw 规范 host：用于识别用户 src 中的规范 raw 地址（GitHub 固有事实，非配置默认值）
const GITHUB_RAW_HOST = 'raw.githubusercontent.com';

// 占位标记类名（组件契约：服务端生成、services 按需加载、客户端渲染共用）
const PLACEHOLDER_CLASS = 'ds-mdrender';

/**
 * 解析 GitHub raw 地址（规范 raw host 或调用方传入的 ghraw 镜像 host）。
 * 返回 { host, owner, repo, ref, rest }；无法识别时返回 null。
 */
function parseGitHubRaw(url, ghrawHost) {
  if (typeof url !== 'string' || url.length === 0) {
    return null;
  }
  let u;
  try {
    u = new URL(url);
  } catch (e) {
    return null;
  }
  const host = u.hostname || '';
  if (host !== GITHUB_RAW_HOST && host !== ghrawHost) {
    return null;
  }
  const segs = u.pathname.split('/').filter(s => s.length > 0);
  if (segs.length < 3) {
    return null;
  }
  return {
    host: host,
    owner: segs[0],
    repo: segs[1],
    ref: segs[2],
    rest: segs.slice(3).join('/')
  };
}

function escapeAttr(value) {
  return String(value).replace(/&/g, '&amp;').replace(/"/g, '&quot;');
}

/**
 * 生成远程 Markdown 渲染占位标记。
 * options: { id, replace, heading, ghraw }
 */
function mdrenderHtml(src, options = {}) {
  const parsed = parseGitHubRaw(src, options.ghraw);
  let url = src;
  let base = null;
  if (parsed) {
    // 未传 ghraw 时保留 src 原 host，不硬编码默认值
    const ghraw = options.ghraw || parsed.host;
    const dir = `${parsed.owner}/${parsed.repo}/${parsed.ref}/`;
    url = `https://${ghraw}/${dir}${parsed.rest}`;
    base = `https://${ghraw}/${dir}`;
  }
  let el = '<div class="data-service ds-mdrender"';
  el += ` src="${escapeAttr(url)}"`;
  if (base) {
    el += ` data-base="${escapeAttr(base)}"`;
  }
  if (options.replace === true) {
    el += ' data-replace="true"';
  }
  if (options.heading !== false) {
    el += ' data-heading="true"';
  }
  if (options.id) {
    el += ` id="${escapeAttr(options.id)}"`;
  }
  el += '></div>';
  return el;
}

module.exports = {
  GITHUB_RAW_HOST,
  PLACEHOLDER_CLASS,
  parseGitHubRaw,
  mdrenderHtml
};
