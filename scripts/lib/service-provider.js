/* global hexo */

"use strict";

function resolveServiceProvider(service) {
  const provider = service?.provider;
  if (provider == null) return null;
  if (typeof service !== "object" || Array.isArray(service)) return null;
  return Object.prototype.hasOwnProperty.call(service, provider) ? service[provider] : null;
}

module.exports = { resolveServiceProvider };
