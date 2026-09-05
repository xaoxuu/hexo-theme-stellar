"use strict";

const { test } = require("node:test");
const assert = require("node:assert/strict");

const {
  SHARE_SERVICE_IDS,
  buildShareAction,
  filterShareServices
} = require("../scripts/lib/share-services");

const share = {
  permalink: "https://example.com/路径/?from=a&mode=\"test\"",
  title: "中文 \"标题\" & Site",
  image: "https://example.com/封面.webp?a=1&b=2",
  summary: "第一行\n第二行 & 摘要"
};

test("share service registry preserves supported order and filters unknown providers", () => {
  assert.deepEqual(SHARE_SERVICE_IDS, [
    "wechat",
    "weibo",
    "x",
    "telegram",
    "whatsapp",
    "email",
    "link",
    "system"
  ]);
  assert.deepEqual(filterShareServices(["system", "unknown", "x", "telegram"]), ["system", "x", "telegram"]);
  assert.deepEqual(filterShareServices(null), []);
  assert.equal(buildShareAction("twitter", share), null);
});

test("external share actions encode text and URLs exactly once", () => {
  const x = new URL(buildShareAction("x", share).href);
  assert.equal(x.origin + x.pathname, "https://x.com/intent/tweet");
  assert.equal(x.searchParams.get("text"), share.title);
  assert.equal(x.searchParams.get("url"), share.permalink);

  const telegram = new URL(buildShareAction("telegram", share).href);
  assert.equal(telegram.origin + telegram.pathname, "https://t.me/share/url");
  assert.equal(telegram.searchParams.get("url"), share.permalink);
  assert.equal(telegram.searchParams.get("text"), share.title);

  const whatsapp = new URL(buildShareAction("whatsapp", share).href);
  assert.equal(whatsapp.origin + whatsapp.pathname, "https://wa.me/");
  assert.equal(whatsapp.searchParams.get("text"), `${share.title}\n${share.permalink}`);

  const weibo = new URL(buildShareAction("weibo", share).href);
  assert.equal(weibo.searchParams.get("url"), share.permalink);
  assert.equal(weibo.searchParams.get("title"), share.title);
  assert.equal(weibo.searchParams.get("pics"), share.image);
  assert.equal(weibo.searchParams.get("summary"), share.summary);
});

test("local share actions preserve native, email, copy, and QR behavior", () => {
  assert.deepEqual(buildShareAction("system", share), {
    service: "system",
    label: "System",
    kind: "native",
    data: {
      title: share.title,
      text: share.summary,
      url: share.permalink
    },
    target: "copy-link"
  });
  assert.deepEqual(buildShareAction("link", share), {
    service: "link",
    label: "Link",
    kind: "copy",
    target: "copy-link"
  });
  assert.deepEqual(buildShareAction("wechat", share), {
    service: "wechat",
    label: "WeChat",
    kind: "toggle",
    target: "qrcode-wechat"
  });

  const email = new URL(buildShareAction("email", share).href);
  assert.equal(email.protocol, "mailto:");
  assert.equal(email.searchParams.get("subject"), share.title);
  assert.equal(email.searchParams.get("body"), share.permalink);
});
