/* global hexo */
"use strict";

function pageInjectText(value) {
  if (typeof value === "string") return value;
  return "";
}

function mergeTrustedInject(siteText, pageValue) {
  const site = typeof siteText === "string" ? siteText : "";
  const page = pageInjectText(pageValue);
  if (site.length === 0) return page;
  if (page.length === 0) return site;
  return `${site}\n${page}`;
}

module.exports = {
  mergeTrustedInject,
  pageInjectText
};
