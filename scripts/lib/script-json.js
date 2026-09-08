"use strict";

// Safe in executable scripts and JSON script elements.
function scriptJson(value) {
  return JSON.stringify(value)
    ?.replace(/&/g, "\\u0026")
    .replace(/</g, "\\u003c")
    .replace(/>/g, "\\u003e")
    .replace(/\u2028/g, "\\u2028")
    .replace(/\u2029/g, "\\u2029") || "null";
}

module.exports = { scriptJson };
