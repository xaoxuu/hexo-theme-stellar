"use strict";

const { createHash } = require("node:crypto");
const { load } = require("cheerio");
const { scriptJson } = require("./script-json");
const { pageViewModelsFor } = require("./page-view-model-registry");

function pageMeta(html) {
  const $ = load(html || "", null, false);
  $.root().children().attr("data-stellar-page-meta", "");
  return $.html();
}

function executable(script) {
  const type = (script.attr("type") || "").trim().toLowerCase();
  return !(/^(application\/(?:ld\+)?json|math\/tex(?:;.*)?)$/.test(type));
}

function processNavigation(html, locals) {
  if (typeof html !== "string" || !this.stellar?.config?.features?.partialNavigation?.enabled) return html;
  const registry = pageViewModelsFor(this);
  const model = registry.getPageViewModel(locals?.page);
  if (!model) return html;
  const collection = JSON.stringify([model.collection.profile, model.collection.id]);
  const $ = load(html);
  if ($("#main").length !== 1 || $("#stellar-runtime-config").length !== 1) return html;
  $("#stellar-navigation-config").remove();
  $("a[data-stellar-navigation]").removeAttr("data-stellar-navigation");
  // Unmanaged executable code cannot be safely replayed or disposed on a partial navigation.
  if ($("script").toArray().some(node => executable($(node)) && !$(node).is("[data-stellar-script]"))) return html;
  const base = new URL(locals.page.permalink || model.item.route.permalink, this.config.url);
  const root = new URL(this.config.root || "/", base).pathname.replace(/\/?$/, "/");
  $("a[href]").each((_, node) => {
    const link = $(node);
    let target;
    try { target = new URL(link.attr("href"), base); } catch { return; }
    if (target.origin !== base.origin || !target.pathname.startsWith(root)) return;
    let path;
    try { path = decodeURI(target.pathname.slice(root.length)); } catch { return; }
    const member = registry.getNavigationCollection(path)
      || (path.endsWith("/") || !path ? registry.getNavigationCollection(path + "index.html") : null);
    if (member === collection) link.attr("data-stellar-navigation", "");
  });
  const manifest = JSON.parse($("#stellar-runtime-config").text());
  const shell = load($.html());
  shell("#main, #rightbar-region, [data-stellar-page-meta], [data-stellar-page-style], #stellar-runtime-config").remove();
  shell("[data-stellar-script='defines']").empty();
  shell("body").removeAttr("data-page-type data-page-layout data-article-style data-text-indent");
  shell(".site-shell").removeAttr("data-regions");
  shell("a[aria-current='page']").removeAttr("aria-current");
  shell(".ui-collection__item.is-active").removeClass("is-active");
  shell(".ui-collection__indicator").remove();
  const persistent = manifest.extensions.filter(entry => entry.scope === "document"
    || (entry.when.selector && shell(entry.when.selector).length > 0));
  const signature = createHash("sha256").update(shell.html()).update(JSON.stringify({
    root: manifest.root, policy: manifest.policy, extensions: persistent
  })).digest("hex");
  $("body").append(`<script type="application/json" id="stellar-navigation-config">${scriptJson({
    collection, url: base.href, signature
  })}</script>`);
  return $.html();
}

module.exports = { pageMeta, processNavigation };
