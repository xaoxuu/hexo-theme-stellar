"use strict";

function normalizeResource(value) {
  if (typeof value !== "string" || /^(?:[a-z][a-z0-9+.-]*:|\/\/)/i.test(value)) return value;
  return "/" + value.replace(/^(?:\.\/|\/)+/, "");
}

function splitResources(input = {}, defaults = {}, fields = []) {
  const options = { ...input };
  const assets = {};
  for (const field of fields) {
    const key = field.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
    assets[key] = normalizeResource(options[field] ?? defaults[field] ?? null);
    delete options[field];
  }
  return { options, assets };
}

module.exports = { splitResources };
