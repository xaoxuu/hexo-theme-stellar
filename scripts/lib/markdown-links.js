"use strict";

function headingAnchor(value) {
  return String(value)
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9\u4e00-\u9fff -]/g, "")
    .replace(/\s+/g, "-");
}

function markdownAnchors(markdown) {
  return markdown
    .split("\n")
    .filter(line => /^#{1,6} /.test(line))
    .map(line => headingAnchor(line.replace(/^#{1,6} /, "")));
}

module.exports = {
  headingAnchor,
  markdownAnchors
};
