"use strict";

const { SHARE_SERVICE_IDS } = require("../lib/share-services");

function literal(value) {
  return { kind: "literal", value };
}

function item(type, options = {}) {
  return { type: Array.isArray(type) ? type : [type], default: literal(options.defaultValue), normalizer: options.normalizer || "identity", ...options };
}

const menuItem = item("object", {
  defaultValue: {},
  normalizer: "menu_item",
  sealed: true,
  properties: {
    type: item("string", { defaultValue: "link", values: ["link", "search"] }),
    id: item(["string", "null"], { defaultValue: null, validator: "nullable_kebab_id" }),
    title: item(["string", "null"], { defaultValue: null }),
    icon: item(["string", "null"], { defaultValue: null, validator: "nullable_non_empty_string" }),
    url: item(["string", "null"], { defaultValue: null, validator: "nullable_safe_navigation_url" }),
    accent: item(["string", "null"], { defaultValue: null, validator: "nullable_css_color" })
  }
});

const footerActionItem = item("object", {
  defaultValue: {},
  normalizer: "footer_action_item",
  sealed: true,
  properties: {
    type: item("string", { defaultValue: "link", values: ["link", "button"] }),
    icon: item(["string", "null"], { defaultValue: null, validator: "nullable_non_empty_string" }),
    title: item("string", { defaultValue: "", validator: "non_empty_string" }),
    url: item(["string", "null"], { defaultValue: null, validator: "nullable_safe_navigation_url" }),
    onclick: item(["string", "null"], { defaultValue: null, validator: "nullable_non_empty_string" })
  }
});

const footerAction = item("object", {
  defaultValue: {},
  normalizer: "footer_action",
  sealed: true,
  properties: {
    type: item("string", { defaultValue: "link", values: ["link", "button", "dropdown", "spacer"] }),
    icon: item(["string", "null"], { defaultValue: null, validator: "nullable_non_empty_string" }),
    title: item(["string", "null"], { defaultValue: null }),
    url: item(["string", "null"], { defaultValue: null, validator: "nullable_safe_navigation_url" }),
    onclick: item(["string", "null"], { defaultValue: null, validator: "nullable_non_empty_string" }),
    items: item("array", { defaultValue: [], normalizer: "array", items: footerActionItem })
  }
});

const aboutItem = item("object", {
  defaultValue: {},
  normalizer: "object",
  sealed: true,
  requiredProperties: ["key", "value"],
  properties: {
    key: item("string", { defaultValue: "", validator: "non_empty_string" }),
    value: item("string", { defaultValue: "", validator: "non_empty_string" }),
    url: item(["string", "null"], { defaultValue: null, validator: "nullable_template_navigation_url" })
  }
});

const footerSectionItem = item("object", {
  defaultValue: {},
  normalizer: "object",
  sealed: true,
  requiredProperties: ["title", "url"],
  properties: {
    title: item("string", { defaultValue: "", validator: "non_empty_string" }),
    url: item("string", { defaultValue: "", validator: "safe_navigation_url" })
  }
});

const footerSection = item("object", {
  defaultValue: {},
  normalizer: "object",
  sealed: true,
  requiredProperties: ["title", "items"],
  properties: {
    title: item("string", { defaultValue: "", validator: "non_empty_string" }),
    items: item("array", { defaultValue: [], normalizer: "array", items: footerSectionItem })
  }
});

const navigationTab = item("object", {
  defaultValue: {},
  normalizer: "object",
  sealed: true,
  requiredProperties: ["title", "url"],
  properties: {
    title: item("string", { defaultValue: "", validator: "non_empty_string" }),
    url: item("string", { defaultValue: "", validator: "safe_navigation_url" })
  }
});

const contributorRepository = item("object", {
  defaultValue: { branch: "main" },
  normalizer: "object",
  sealed: true,
  requiredProperties: ["source_prefix", "repository"],
  properties: {
    source_prefix: item("string", { defaultValue: "", runtimeKey: "sourcePrefix", validator: "safe_relative_path" }),
    repository: item("string", { defaultValue: "", validator: "github_repository" }),
    branch: item("string", { defaultValue: "main", validator: "non_empty_string" })
  }
});

const stringRecord = validator => ({
  normalizer: "object",
  sealed: false,
  properties: {},
  additionalPropertyKey: "<key>",
  additionalProperties: item("string", { defaultValue: "", ...(validator ? { validator } : {}) })
});

const parameterBag = { normalizer: "parameter_bag", sealed: false };
const widgetItems = item(["string", "object"], { defaultValue: null, normalizer: "parameter_bag", sealed: false });
const brandImage = {
  type: ["object"],
  default: literal({ src: null, variant: "avatar" }),
  normalizer: "object",
  sealed: true,
  properties: {
    src: item(["string", "null"], { defaultValue: null, validator: "nullable_non_empty_string" }),
    variant: item("string", { defaultValue: "avatar", values: ["avatar", "icon", "plain"] })
  }
};
const brandProperties = {
  image: brandImage,
  name: item(["string", "null"], { defaultValue: null }),
  tagline: item(["string", "null"], { defaultValue: null }),
  href: item(["string", "null"], { defaultValue: "/", validator: "nullable_safe_navigation_url" })
};
const leftbarBrandProperties = {
  style: item("string", { defaultValue: "regular", values: ["regular", "compact"] }),
  ...brandProperties
};
const regionBrand = properties => ({
  type: ["object", "boolean"],
  normalizer: "parameter_bag",
  sealed: true,
  validator: "brand",
  properties
});
const inheritedRegionBrand = properties => ({
  ...regionBrand(properties),
  type: ["object", "boolean", "null"],
  defaultValue: null
});

const CONFIG_RULES = Object.freeze([
  ["settings.about.items", { items: aboutItem }],
  ["footer.sections", { items: footerSection }],
  ["footer.content", { normalizer: "trusted_text" }],

  ["topbar.enabled", { type: ["boolean"] }],
  ["topbar.brand", regionBrand(brandProperties)],
  ["topbar.menu", { validator: "menu_items", items: menuItem }],
  ["topbar.widgets", { items: widgetItems }],
  ["leftbar.default_state", { values: ["expanded", "collapsed"] }],
  ["leftbar.enabled", { type: ["boolean"] }],
  ["leftbar.brand", regionBrand(leftbarBrandProperties)],
  ["leftbar.menu", { validator: "menu_items", items: menuItem }],
  ["leftbar.footer.actions", { validator: "footer_actions", items: footerAction }],
  ["leftbar.widgets", { items: widgetItems }],
  ["rightbar.enabled", { type: ["boolean"] }],
  ["rightbar.widgets", { items: widgetItems }],
  ["profiles.*.path", { type: ["string", "null"], defaultValue: null, normalizer: "root_relative_path", validator: "nullable_non_empty_string" }],
  ["profiles.*.active_menu", { type: ["string", "null"], defaultValue: null, validator: "nullable_kebab_id" }],
  ["profiles.*.topbar.enabled", { type: ["boolean", "null"], defaultValue: null }],
  ["profiles.*.topbar.brand", inheritedRegionBrand(brandProperties)],
  ["profiles.*.topbar.menu", { type: ["array", "null"], defaultValue: null, validator: "menu_items", items: menuItem }],
  ["profiles.*.topbar.widgets", { type: ["array", "null"], defaultValue: null, items: widgetItems }],
  ["profiles.*.leftbar.enabled", { type: ["boolean", "null"], defaultValue: null }],
  ["profiles.*.leftbar.brand", inheritedRegionBrand(leftbarBrandProperties)],
  ["profiles.*.leftbar.menu", { type: ["array", "null"], defaultValue: null, validator: "menu_items", items: menuItem }],
  ["profiles.*.leftbar.footer.actions", { type: ["array", "null"], defaultValue: null, validator: "footer_actions", items: footerAction }],
  ["profiles.*.leftbar.widgets", { type: ["array", "null"], defaultValue: null, items: widgetItems }],
  ["profiles.*.rightbar.enabled", { type: ["boolean", "null"], defaultValue: null }],
  ["profiles.*.rightbar.widgets", { type: ["array", "null"], defaultValue: null, items: widgetItems }],
  ["profiles.*.listing_nav.tabs", { validator: "navigation_tabs", items: navigationTab }],
  ["profiles.home.comments.title", { type: ["string", "null"] }],
  ["profiles.home.comments.id", { type: ["string", "null"], normalizer: "nullable_trimmed_string", validator: "nullable_non_empty_string" }],
  ["profiles.home.comments.provider", { type: ["string", "null"], values: [null, "beaudar", "utterances", "giscus", "twikoo", "waline", "artalk"] }],
  ["profiles.home.comments.options", parameterBag],

  ["article.style", { values: ["tech", "story"] }],
  ["article.paragraph_indent", { values: ["auto", "always", "never"] }],
  ["article.listing.pinned_layout", { values: ["carousel", "flat"] }],
  ["article.listing.card_layout", { values: ["hero", "classic"] }],
  ["article.listing.cover_ratio", { exclusiveMinimum: 0 }],
  ["article.listing.excerpt_length", { minimum: 0, validator: "non_negative_integer" }],
  ["article.banner.ratio", { exclusiveMinimum: 0 }],
  ["article.category_colors", stringRecord("css_color")],
  ["article.footer.license", { type: ["boolean", "string"], validator: "license_value" }],
  ["article.footer.share", { items: item("string", { defaultValue: "", values: SHARE_SERVICE_IDS }), normalizer: "trimmed_string_list" }],
  ["article.related_posts_limit", { minimum: 0, validator: "non_negative_integer" }],
  ["notebook.listing.excerpt_length", { minimum: 0, validator: "non_negative_integer" }],
  ["notebook.listing.per_page", { type: ["number", "null"], minimum: 0, validator: "nullable_non_negative_integer" }],
  ["notebook.listing.sort.field", { values: ["date", "updated", "title"] }],
  ["notebook.listing.sort.direction", { values: ["asc", "desc"] }],
  ["notebook.tag_icons", { ...stringRecord(), validator: "non_empty_record_keys" }],
  ["notebook.footer.license", { type: ["string", "boolean", "null"], validator: "license_override" }],
  ["notebook.footer.share", { type: ["array", "null"], items: item("string", { defaultValue: "", values: SHARE_SERVICE_IDS }), normalizer: "nullable_trimmed_string_list" }],

  ["appearance.preset", { values: ["card", "glass", "minimal", "flat"] }],
  ["appearance.color_scheme", { values: ["auto", "light", "dark"] }],
  ["appearance.typography.font_size.*", { validator: "css_length" }],
  ["appearance.typography.font_family.*", { validator: "css_font_family" }],
  ["appearance.typography.content_align", { values: ["left", "center", "right", "justify"] }],
  ["appearance.shape.corner", { validator: "corner_shape" }],
  ["appearance.shape.radius.*", { validator: "css_length" }],
  ["appearance.colors.*", { validator: "css_color" }],
  ["appearance.gradients.*", { validator: "css_gradient" }],
  ["appearance.code_block.scrollbar_width", { validator: "css_length" }],
  ["appearance.code_block.highlight_stylesheet", { type: ["string", "null"], validator: "nullable_resource" }],
  ["appearance.backgrounds.leftbar.type", { values: ["none", "gradient", "image"], normalizer: "leftbar_background_type" }],
  ["appearance.backgrounds.leftbar.image", { type: ["string", "null"], validator: "nullable_resource" }],
  ["appearance.backgrounds.leftbar.gradient.*", { validator: "sidebar_gradient_colors", items: item("string", { defaultValue: "" }) }],
  ["appearance.backgrounds.leftbar.opacity", { minimum: 0, maximum: 1 }],
  ["appearance.backgrounds.leftbar.backdrop.radius", { validator: "css_length" }],
  ["appearance.backgrounds.page.image", { type: ["string", "null"], validator: "nullable_resource" }],
  ["appearance.backgrounds.page.backdrop.radius", { validator: "css_length" }],
  ["appearance.backgrounds.page.backdrop.overlay", { validator: "css_color" }],
  ["appearance.backgrounds.page.backdrop.saturation", { validator: "css_percentage" }],

  ["canonical.host", { type: ["string", "null"], normalizer: "nullable_host" }],
  ["canonical.allowed_hosts", { items: item("string", { defaultValue: "" }), normalizer: "host_list" }],
  ["open_graph.twitter_id", { type: ["string", "null"] }],
  ["structured_data.same_as", { items: item("string", { defaultValue: "" }), normalizer: "trimmed_string_list" }],
  ["preconnect", { items: item("string", { defaultValue: "" }), normalizer: "origin_list" }],
  ["fallbacks.*", { validator: "resource" }],
  ["error_page.image", { type: ["string", "null"], validator: "nullable_resource" }],

  ["search.provider", { type: ["string", "null"], values: [null, "local", "algolia"] }],
  ["search.local.cache_ttl_seconds", { minimum: 0, validator: "non_negative_integer" }],
  ["search.algolia", parameterBag],
  ["comments.provider", { type: ["string", "null"], values: [null, "beaudar", "utterances", "giscus", "twikoo", "waline", "artalk"] }],
  ["comments.title", { type: ["string", "null"] }],
  ...["beaudar", "utterances", "giscus", "twikoo", "waline", "artalk"].map(id => [`comments.${id}`, parameterBag]),
  ["tags.quot", {
    normalizer: "object",
    sealed: false,
    additionalPropertyKey: "<variant>",
    additionalProperties: item("object", {
      defaultValue: {}, normalizer: "object", sealed: true,
      properties: {
        prefix: item(["string", "null"], { defaultValue: null }),
        suffix: item(["string", "null"], { defaultValue: null })
      }
    })
  }],
  ["tags.emoji", { validator: "emoji_sources" }],
  ["tags.emoji.default_source", { validator: "non_empty_string" }],
  ["tags.emoji.sources", stringRecord("emoji_template")],
  ["tags.icon.default_color", { type: ["string", "null"] }],
  ["tags.button.default_color", { type: ["string", "null"] }],
  ["tags.hashtag.default_color", { type: ["string", "null"] }],
  ["tags.gallery.size", { values: ["s", "m", "l", "xl", "mix"] }],
  ["tags.gallery.aspect_ratio", { values: ["original", "square", "portrait"] }],
  ["features.lazy_loading.transition", { values: ["blur", "fade"] }],
  ["features.lightbox.selector", { validator: "css_selector" }],
  ["features.math.provider", { type: ["string", "null"], values: [null, "katex", "mathjax"] }],
  ["features.math.katex", parameterBag],
  ["features.math.mathjax", parameterBag],
  ["features.diagrams.provider", { type: ["string", "null"], values: [null, "mermaid"] }],
  ["features.diagrams.mermaid.theme", { values: ["default", "dark", "forest", "neutral"] }],
  ["services.site_info.provider", { type: ["string", "null"], values: [null, "site_info_api"] }],
  ["services.site_info.site_info_api", { runtimeKey: "site_info_api" }],
  ["services.rating.provider", { type: ["string", "null"], values: [null, "star_vote"] }],
  ["services.rating.star_vote", { runtimeKey: "star_vote" }],
  ["services.vote.provider", { type: ["string", "null"], values: [null, "star_vote"] }],
  ["services.vote.star_vote", { runtimeKey: "star_vote" }],
  ["services.contributors.provider", { values: ["github"] }],
  ["services.contributors.github.repositories", { validator: "contributor_repositories", items: contributorRepository }],
  ["services.github.*", { validator: "absolute_http_url" }],
  ["services.github_card.provider", { values: ["github_readme_stats"] }],
  ["services.github_card.github_readme_stats", { runtimeKey: "github_readme_stats" }],
  ["services.*.*.endpoint", { validator: "absolute_http_url" }],
  ["inject.head_end", { normalizer: "trusted_text" }],
  ["inject.body_end", { normalizer: "trusted_text" }]
]);

module.exports = {
  CONFIG_RULES,
  literal
};
