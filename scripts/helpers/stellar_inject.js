/* global hexo */
"use strict";

const { mergeTrustedInject } = require("../lib/config-inject");

hexo.extend.helper.register("stellar_inject", function(kind, pageValue) {
  const siteText = this.stellar_config(`inject.${kind}`);
  return mergeTrustedInject(siteText, pageValue);
});
