"use strict";

const { createHash } = require("node:crypto");

// URL overrides keep their document-relative semantics. SVG data URLs can be
// shared as an image file without depending on a browser script being ready.
function imageFallbackAsset(value) {
  if (typeof value !== "string") return null;
  const match = /^data:image\/svg\+xml((?:;[^,]*)?),(.*)$/is.exec(value);
  if (!match) return null;
  let data;
  try {
    data = /;base64(?:;|$)/i.test(match[1])
      ? Buffer.from(decodeURIComponent(match[2]), "base64")
      : Buffer.from(decodeURIComponent(match[2]), "utf8");
  } catch {
    // An undecodable user value remains a URL; optimization must not block builds.
    return null;
  }
  const hash = createHash("sha256").update(data).digest("hex").slice(0, 16);
  return { path: `images/stellar-error.${hash}.svg`, data };
}

module.exports = { imageFallbackAsset };
