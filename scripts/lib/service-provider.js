/* global hexo */

"use strict";

function resolveServiceProvider(service) {
  const provider = service?.provider;
  if (provider == null) return null;
  const providers = service?.providers;
  if (providers == null || typeof providers !== "object" || Array.isArray(providers)) return null;
  return Object.prototype.hasOwnProperty.call(providers, provider) ? providers[provider] : null;
}

module.exports = { resolveServiceProvider };
