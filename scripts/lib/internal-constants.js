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
      codeCopyFeedbackMs: 3000,
      codeCopyToastMs: 2500
    }
  },
  appearance: {
    gradientAngle: "210deg"
  },
  resources: {
    projectIcon: "https://gcore.jsdelivr.net/gh/cdn-x/placeholder@1.0.12/image/2779789.png",
    banner: "https://gcore.jsdelivr.net/gh/cdn-x/placeholder@1.0.12/banner/books.jpg",
    topicCover: "https://gcore.jsdelivr.net/gh/cdn-x/placeholder@1.0.12/image/10433048.png",
    contentImage: "https://gcore.jsdelivr.net/gh/cdn-x/placeholder@1.0.12/image/2659360.svg"
  },
  assets: {
    runtime: {
      bootstrap: "/js/runtime/index.mjs",
      colorSchemeSwitch: "/js/runtime/extensions/color-scheme-switch.mjs",
      reveal: "/js/runtime/extensions/reveal.mjs"
    },
    dependencies: {
      marked: "https://gcore.jsdelivr.net/npm/marked@13.0/lib/marked.umd.min.js",
      lazyLoading: "https://gcore.jsdelivr.net/npm/vanilla-lazyload@19.1/dist/lazyload.min.js"
    },
    search: {
      algolia: "https://gcore.jsdelivr.net/algoliasearch/3/algoliasearch.min.js",
      providers: {
        algolia: "/js/search/algolia-search.js",
        local: "/js/search/local-search.js"
      },
      shortcut: "/js/search/shortcut.js"
    },
    comments: {
      beaudar: {
        js: "https://beaudar.lipk.org/client.js",
        localCss: "/css/comments/beaudar.css"
      },
      utterances: {
        js: "https://utteranc.es/client.js",
        localCss: "/css/comments/utterances.css"
      },
      giscus: { js: "https://giscus.app/client.js" },
      twikoo: {
        js: "https://gcore.jsdelivr.net/npm/twikoo@1.6/dist/twikoo.all.min.js",
        localCss: "/css/comments/twikoo.css"
      },
      waline: {
        js: "https://gcore.jsdelivr.net/npm/@waline/client@3.15.2/dist/waline.js",
        css: "https://gcore.jsdelivr.net/npm/@waline/client@3.15.2/dist/waline.css",
        metaCss: "https://gcore.jsdelivr.net/npm/@waline/client@3.15.2/dist/waline-meta.css",
        localCss: "/css/comments/waline.css"
      },
      artalk: {
        js: "https://unpkg.com/artalk@2.9/dist/artalk.js",
        css: "https://unpkg.com/artalk@2.9/dist/artalk.css",
        localCss: "/css/comments/artalk.css"
      }
    },
    features: {
      linkPrefetch: "https://gcore.jsdelivr.net/npm/flying-pages@2/flying-pages.min.js",
      lightbox: {
        js: "https://gcore.jsdelivr.net/npm/@fancyapps/ui@5.0/dist/fancybox/fancybox.umd.js",
        css: "https://gcore.jsdelivr.net/npm/@fancyapps/ui@5.0/dist/fancybox/fancybox.css",
        localCss: "/css/plugins/fancybox.css"
      },
      swiper: {
        js: "https://unpkg.com/swiper@10.3/swiper-bundle.min.js",
        css: "https://unpkg.com/swiper@10.3/swiper-bundle.min.css",
        localCss: "/css/plugins/swiper.css"
      },
      katexCss: "https://cdn.jsdelivr.net/npm/katex@0.16.23/dist/katex.min.css",
      mathjax: "https://cdnjs.cloudflare.com/ajax/libs/mathjax/3.2.2/es5/tex-mml-chtml.min.js",
      diagrams: {
        js: "https://gcore.jsdelivr.net/npm/mermaid@11/dist/mermaid.min.js"
      },
      codeCopy: { js: "/js/plugins/copycode.js" },
      adaptiveText: {
        colorJs: "/js/color.js",
        js: "/js/plugins/adaptive-text.js"
      },
      cardHover: { js: "/js/plugins/card-hover.js" },
      deferredIcons: { js: "/js/icons.js" },
      dropdown: { js: "/js/plugins/dropdown.js" },
      heti: {
        css: "https://unpkg.com/heti@0.9/umd/heti.min.css",
        js: "https://unpkg.com/heti@0.9/umd/heti-addon.min.js"
      }
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
      fcircle: { js: "/js/services/fcircle.js" },
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
