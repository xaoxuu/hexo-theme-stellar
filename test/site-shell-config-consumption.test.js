"use strict";

const { test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const ROOT = path.resolve(__dirname, "..");

function read(file) {
  return fs.readFileSync(path.join(ROOT, file), "utf8");
}

test("Shell 消费链只读取冻结的 site 配置", () => {
  const brandHelper = read("scripts/helpers/brand.js");
  const models = read("scripts/lib/models/index.js");
  const menu = read("layout/_partial/sidebar/menu.ejs");
  const leftFooter = read("layout/_partial/sidebar/index_leftbar.ejs");
  const mainFooter = read("layout/_partial/main/footer.ejs");

  assert.match(brandHelper, /hexo\.stellar\.config\.site\.brand/);
  assert.doesNotMatch(brandHelper, /hexo\.theme\.config\.brand/);
  assert.match(models, /stellarConfig\.site\.brand/);
  assert.doesNotMatch(models, /themeConfig\.brand/);

  assert.match(menu, /stellar_config\('site\.menu\.items'\)/);
  assert.match(menu, /menuItem\.accent/);
  assert.doesNotMatch(menu, /theme\.menubar|menuItem\.theme/);

  assert.match(leftFooter, /stellar_config\('site\.footer\.actions'\)/);
  assert.match(leftFooter, /item\.type === 'link'|item\.type === 'dropdown'/);
  assert.match(leftFooter, /item\.type === 'button'/);
  assert.match(leftFooter, /escape_html\(item\.onclick\)/);
  assert.doesNotMatch(leftFooter, /theme\.footer|item\.variant|item\.action/);

  assert.match(mainFooter, /stellar_config\('site\.footer'\)/);
  assert.match(mainFooter, /siteFooter\.sections|siteFooter\.content/);
  assert.doesNotMatch(mainFooter, /theme\.footer|\.sitemap/);
});

test("Brand 渲染只消费规范化后的 variant", () => {
  const template = read("layout/_partial/sidebar/brand.ejs");
  assert.match(template, /image\.variant/);
  assert.match(template, /if \(!brand\.image\?\.src && !brand\.name && !brand\.wordmark\) return ''/);
  assert.doesNotMatch(template, /image\.style/);
});
