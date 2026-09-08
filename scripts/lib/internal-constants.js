/* global hexo */

"use strict";

function deepFreeze(value) {
  if (value == null || typeof value !== "object" || Object.isFrozen(value)) return value;
  Object.values(value).forEach(deepFreeze);
  return Object.freeze(value);
}

module.exports = deepFreeze({
  providers: {
    linkPrefetch: "flying_pages",
    lightbox: "fancybox",
    diagrams: "mermaid"
  },
  runtime: {
    cache: {
      enabled: true,
      defaultTtl: 3600,
      ttl: {
        giscus: 600,
        waline: 600,
        artalk: 600,
        memos: 600,
        "memos-user": 86400,
        sites: 86400,
        friends: 86400,
        friends_and_posts: 86400,
        siteinfo: 86400
      },
      maxEntries: 200
    },
    request: {
      retries: 2,
      timeoutMs: 5000,
      idleTimeoutMs: 3000,
      maxCacheEntryBytes: 200 * 1024
    },
    features: {
      codeCopyToastMs: 2500
    }
  },
  appearance: {
    gradientAngle: "210deg"
  },
  assets: {
    runtime: {
      bootstrap: "/js/runtime/index.js",
      colorSchemeSwitch: "/js/runtime/extensions/color-scheme-switch.js",
      deferredIcons: "/js/runtime/extensions/deferred-icons.js",
      dropdown: "/js/runtime/extensions/dropdown.js",
      heroEffect: "/js/runtime/extensions/hero-effect.js",
      reveal: "/js/runtime/extensions/reveal.js",
      settings: "/js/runtime/extensions/settings.js"
    },
    heroEffects: {
      ferrofluid: "/js/runtime/hero-effects/ferrofluid.js",
      galaxy: "/js/runtime/hero-effects/galaxy.js",
      lightRays: "/js/runtime/hero-effects/light-rays.js"
    },
    search: {
      providers: {
        algolia: "/js/search/algolia-search.js",
        local: "/js/search/local-search.js"
      },
      shortcut: "/js/search/shortcut.js"
    },
    comments: {
      beaudar: {
        localCss: "/css/comments/beaudar.css"
      },
      utterances: {
        localCss: "/css/comments/utterances.css"
      },
      twikoo: {
        localCss: "/css/comments/twikoo.css"
      },
      waline: {
        localCss: "/css/comments/waline.css"
      },
      artalk: {
        localCss: "/css/comments/artalk.css"
      }
    },
    features: {
      lightbox: {
        localCss: "/css/plugins/fancybox.css"
      },
      swiper: {
        localCss: "/css/plugins/swiper.css"
      },
      codeCopy: { js: "/js/plugins/copycode.js" },
      adaptiveText: {
        colorJs: "/js/color.js",
        js: "/js/plugins/adaptive-text.js"
      },
      cardHover: { js: "/js/plugins/card-hover.js" }
    },
    services: {
      chat: { endpoint: "https://siteinfo.listentothewind.cn/api/v1" },
      mdrender: { js: "/js/services/mdrender.js" },
      siteinfo: { js: "/js/services/siteinfo.js" },
      ghinfo: { js: "/js/services/ghinfo.js" },
      rating: { js: "/js/services/rating.js" },
      vote: { js: "/js/services/vote.js" },
      sites: { js: "/js/services/sites.js" },
      friends: { js: "/js/services/friends.js" },
      friends_and_posts: { js: "/js/services/friends_and_posts.js" },
      timeline: { js: "/js/services/timeline.js" },
      weibo: { js: "/js/services/weibo.js" },
      memos: { js: "/js/services/memos.js" },
      voice: { js: "/js/plugins/voice.js" },
      video: { js: "/js/plugins/video.js" },
      "download-file": { js: "/js/plugins/download-file.js" },
      twikoo: { js: "/js/services/twikoo_latest_comment.js" },
      waline: { js: "/js/services/waline_latest_comment.js" },
      artalk: { js: "/js/services/artalk_latest_comment.js" },
      giscus: { js: "/js/services/giscus_latest_comment.js" },
      contributors: { js: "/js/services/contributors.js" },
      rss: { js: "/js/services/rss.js" }
    }
  }
});
