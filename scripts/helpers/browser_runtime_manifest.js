/* global hexo */

"use strict";

const {
  buildBrowserRuntimeManifest,
  serializeBrowserRuntimeManifest
} = require("../lib/browser-runtime");

hexo.extend.helper.register("browser_runtime_manifest", function(input) {
  return serializeBrowserRuntimeManifest(buildBrowserRuntimeManifest(input));
});
