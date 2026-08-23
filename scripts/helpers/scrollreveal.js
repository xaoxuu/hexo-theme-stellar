/* global hexo */
"use strict";

hexo.extend.helper.register("scrollreveal", function(args) {
  if (hexo.stellar.config.extensions.features.reveal.enabled) {
    return `${args ? args : ""}slide-up`;
  }
  return "";
});
