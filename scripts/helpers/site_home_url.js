/* global hexo */
"use strict";

// 站点首页地址。
// root 为 / 时就是站内根，返回相对路径，保持既有输出不变。
// 站点挂在子路径下（root 不为 /）时返回父站根 https://{canonical.host}：
// 此时访客理解的“首页”是父站首页，而不是这个子站自己的根。
//
// 该值会直接写入 href 属性而不再做 HTML 转义（转义会把 "/" 编码成 "&#x2F;"，
// 使 Hexo 的外链过滤把同域绝对链接误判为外链并加上 target="_blank"），
// 因此这里只接受域名形态，避免配置里出现引号等字符破坏属性。
hexo.extend.helper.register("site_home_url", function() {
  const root = String(hexo.config.root || "/");
  if (root === "/") return "/";
  const host = hexo.stellar?.config?.canonical?.host;
  if (typeof host === "string" && /^[A-Za-z0-9.-]+(?::\d+)?$/.test(host)) return `https://${host}`;
  return root;
});
