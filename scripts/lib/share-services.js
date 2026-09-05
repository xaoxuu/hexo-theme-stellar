"use strict";

const SHARE_SERVICE_IDS = Object.freeze([
  "wechat",
  "weibo",
  "x",
  "telegram",
  "whatsapp",
  "email",
  "link",
  "system"
]);

const SHARE_SERVICE_SET = new Set(SHARE_SERVICE_IDS);
const SHARE_SERVICE_LABELS = Object.freeze({
  wechat: "WeChat",
  weibo: "Weibo",
  email: "Email",
  link: "Link",
  system: "System",
  x: "X",
  telegram: "Telegram",
  whatsapp: "WhatsApp"
});

function text(value) {
  return value == null ? "" : String(value);
}

function query(pairs) {
  return pairs
    .filter(([, value, omitEmpty]) => !omitEmpty || value !== "")
    .map(([key, value]) => `${key}=${encodeURIComponent(value)}`)
    .join("&");
}

function filterShareServices(services) {
  if (!Array.isArray(services)) return [];
  return services.filter(service => SHARE_SERVICE_SET.has(service));
}

function buildShareAction(service, share = {}) {
  if (!SHARE_SERVICE_SET.has(service)) return null;
  const permalink = text(share.permalink);
  const title = text(share.title);
  const image = text(share.image);
  const summary = text(share.summary);
  const action = {
    service,
    label: SHARE_SERVICE_LABELS[service]
  };

  if (service === "wechat") {
    action.kind = "toggle";
    action.target = "qrcode-wechat";
  } else if (service === "weibo") {
    action.kind = "external";
    action.href = `https://service.weibo.com/share/share.php?${query([
      ["url", permalink],
      ["title", title],
      ["pics", image, true],
      ["summary", summary]
    ])}`;
  } else if (service === "email") {
    action.kind = "link";
    action.href = `mailto:?${query([["subject", title], ["body", permalink]])}`;
  } else if (service === "link") {
    action.kind = "copy";
    action.target = "copy-link";
  } else if (service === "system") {
    action.kind = "native";
    action.data = {
      title,
      text: summary || title,
      url: permalink
    };
    action.target = "copy-link";
  } else if (service === "x") {
    action.kind = "external";
    action.href = `https://x.com/intent/tweet?${query([["text", title], ["url", permalink]])}`;
  } else if (service === "telegram") {
    action.kind = "external";
    action.href = `https://t.me/share/url?${query([["url", permalink], ["text", title]])}`;
  } else if (service === "whatsapp") {
    action.kind = "external";
    action.href = `https://wa.me/?${query([["text", `${title}\n${permalink}`]])}`;
  }

  return action;
}

module.exports = {
  SHARE_SERVICE_IDS,
  buildShareAction,
  filterShareServices
};
