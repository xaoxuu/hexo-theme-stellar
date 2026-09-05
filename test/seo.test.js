"use strict";

const { test } = require("node:test");
const assert = require("node:assert/strict");

const { firstContentImage, postImages, postDescription } = require("../scripts/lib/seo");

test("SEO image extraction resolves rendered and lazy-loaded content safely", () => {
  assert.equal(
    firstContentImage('<img class="lazy" src="data:image/png;base64,x" data-src="https://example.com/image.webp">'),
    "https://example.com/image.webp"
  );
  assert.equal(firstContentImage('<img src="https://example.com/image.webp">'), "https://example.com/image.webp");
  assert.equal(firstContentImage("<p>No image</p>"), "");
  assert.equal(firstContentImage(null), "");
});

test("SEO helpers produce bounded metadata with empty-state fallbacks", () => {
  assert.deepEqual(postImages({
    content: '<img src="https://example.com/content.webp">'
  }), ["https://example.com/content.webp"]);
  assert.deepEqual(postImages({
    content: "<p>No image</p>",
    defaultCover: "https://example.com/default.webp"
  }), ["https://example.com/default.webp"]);
  assert.deepEqual(postImages({ content: "<p>No image</p>" }), []);

  assert.equal(postDescription({ excerpt: "<strong>Summary</strong>" }), "Summary");
  const description = postDescription({ content: `<p>${"x".repeat(300)}</p>` });
  assert.ok(description.length > 0 && description.length <= 200);
});
