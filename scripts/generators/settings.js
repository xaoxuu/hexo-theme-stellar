/* global hexo */
"use strict";

const { generatorPath, requireLayoutProfiles, toRenderNavigation } = require("../lib/layout-config");
const { routeIdentity } = require("../lib/settings");

function pagesArray(locals) {
  const pages = locals?.get?.("pages");
  if (Array.isArray(pages)) return pages;
  if (typeof pages?.toArray === "function") return pages.toArray();
  return [];
}

hexo.extend.generator.register("settings", function (locals) {
  const profiles = requireLayoutProfiles(hexo.stellar?.config);
  const profile = profiles.settings;
  const outputPath = generatorPath(profile.path);
  const targetRoute = routeIdentity(outputPath);
  const profileConflict = Object.entries(profiles).find(([id, candidate]) => {
    return id !== "settings" && typeof candidate?.path === "string" && routeIdentity(generatorPath(candidate.path)) === targetRoute;
  });
  if (profileConflict) {
    throw new Error(`Stellar v2: 设置页路径 ${profile.path} 与 profiles.${profileConflict[0]} 冲突`);
  }
  const conflict = pagesArray(locals).find(page => routeIdentity(page.path || page.permalink) === targetRoute);
  if (conflict) {
    throw new Error(`Stellar v2: 设置页路径 ${profile.path} 与现有页面 ${conflict.source || conflict.path || conflict.permalink} 冲突`);
  }
  const translate = hexo.theme?.i18n?.__(hexo.config.language) || (key => key);
  return {
    path: outputPath,
    layout: ["settings"],
    data: {
      layout: "settings",
      title: translate("settings.title"),
      robots: "noindex,nofollow",
      sitemap: false,
      feed: false,
      search: false,
      navigation: toRenderNavigation(profile)
    }
  };
});
