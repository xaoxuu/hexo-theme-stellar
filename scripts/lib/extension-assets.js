/* global hexo */

"use strict";

function deepFreeze(value) {
  if (value == null || typeof value !== "object" || Object.isFrozen(value)) return value;
  Object.values(value).forEach(deepFreeze);
  return Object.freeze(value);
}

module.exports = deepFreeze({
  dependencies: {
    marked: "https://gcore.jsdelivr.net/npm/marked@13.0/lib/marked.umd.min.js",
    lazyLoading: "https://gcore.jsdelivr.net/npm/vanilla-lazyload@19.1/dist/lazyload.min.js"
  },
  search: {
    algolia: "https://gcore.jsdelivr.net/algoliasearch/3/algoliasearch.min.js"
  },
  comments: {
    giscus: { js: "https://giscus.app/client.js" },
    twikoo: { js: "https://gcore.jsdelivr.net/npm/twikoo@1.6/dist/twikoo.all.min.js" },
    waline: {
      js: "https://gcore.jsdelivr.net/npm/@waline/client@3.15.2/dist/waline.js",
      css: "https://gcore.jsdelivr.net/npm/@waline/client@3.15.2/dist/waline.css",
      metaCss: "https://gcore.jsdelivr.net/npm/@waline/client@3.15.2/dist/waline-meta.css"
    },
    artalk: {
      js: "https://unpkg.com/artalk@2.9/dist/artalk.js",
      css: "https://unpkg.com/artalk@2.9/dist/artalk.css"
    }
  },
  features: {
    preload: "https://gcore.jsdelivr.net/npm/flying-pages@2/flying-pages.min.js",
    lightbox: {
      js: "https://gcore.jsdelivr.net/npm/@fancyapps/ui@5.0/dist/fancybox/fancybox.umd.js",
      css: "https://gcore.jsdelivr.net/npm/@fancyapps/ui@5.0/dist/fancybox/fancybox.css"
    },
    swiper: {
      js: "https://unpkg.com/swiper@10.3/swiper-bundle.min.js",
      css: "https://unpkg.com/swiper@10.3/swiper-bundle.min.css"
    },
    reveal: "https://gcore.jsdelivr.net/npm/scrollreveal@4.0/dist/scrollreveal.min.js",
    aiSummary: "https://jsd.onmicrosoft.cn/gh/qxchuckle/Post-Summary-AI@6.0/chuckle-post-ai.min.js",
    katexCss: "https://cdn.jsdelivr.net/npm/katex@0.16.23/dist/katex.min.css",
    mathjaxV2: "https://cdnjs.cloudflare.com/ajax/libs/mathjax/2.7.6/MathJax.js?config=TeX-AMS-MML_HTMLorMML",
    mathjaxV3: "https://cdnjs.cloudflare.com/ajax/libs/mathjax/3.2.2/es5/tex-mml-chtml.min.js",
    diagrams: "https://gcore.jsdelivr.net/npm/mermaid@11/dist/mermaid.min.js",
    cjkTypography: {
      css: "https://unpkg.com/heti@0.9/umd/heti.min.css",
      js: "https://unpkg.com/heti@0.9/umd/heti-addon.min.js"
    }
  },
  services: {
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
});
