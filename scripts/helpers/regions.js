/* global hexo */
"use strict";

const { resolveRegions } = require("../lib/regions");

const reported = new Set();

function report(warnings) {
  for (const warning of warnings) {
    const message = `Widget ${warning.widget}（layout=${warning.layout}）不支持 Region ${warning.region}；支持：${warning.supported.join(", ") || "none"}；已跳过`;
    if (reported.has(message)) continue;
    reported.add(message);
    hexo.log.warn(`[Stellar Region] ${message}`);
  }
}

hexo.extend.helper.register("region_layout", function(profile, collectionRegions, pageRegions) {
  const config = hexo.stellar.config;
  const profileConfig = config.profiles[profile] || {};
  const result = resolveRegions({
    profile,
    defaultState: config.leftbar.defaultState,
    catalog: hexo.stellar.data.widgets || {},
    layers: [config, profileConfig, collectionRegions, pageRegions]
  });
  report(result.warnings);
  return {
    topbar: result.topbar,
    leftbar: result.leftbar,
    rightbar: result.rightbar
  };
});

hexo.extend.helper.register("report_region_warnings", function(warnings) {
  report(Array.isArray(warnings) ? warnings : []);
  return "";
});
