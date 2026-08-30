/* global hexo */
"use strict";

const { UI_CAPABILITIES, composeUiClasses } = require("../lib/ui-capabilities");

hexo.extend.helper.register("ui_classes", function(baseClass, capability, modifiers) {
  return composeUiClasses(baseClass, capability, modifiers);
});

hexo.extend.helper.register("ui_capabilities", function() {
  return UI_CAPABILITIES;
});
