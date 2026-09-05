/* global hexo */
"use strict";

const { buildShareAction } = require("../lib/share-services");

hexo.extend.helper.register("share_action", function(service, share) {
  return buildShareAction(service, share);
});
