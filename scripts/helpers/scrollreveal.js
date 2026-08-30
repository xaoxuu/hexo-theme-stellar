/* global hexo */
"use strict";

hexo.extend.helper.register("scrollreveal", function(args) {
  if (hexo.stellar.config.features.reveal.enabled) {
    return `${args ? args : ""}slide-up`;
  }
  return "";
});
