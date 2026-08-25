/* global hexo */

"use strict";

const { resolveServiceProvider } = require("../lib/service-provider");

hexo.extend.helper.register("service_provider", function(service) {
  return resolveServiceProvider(service);
});
