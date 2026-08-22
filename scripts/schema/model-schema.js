/* global hexo */
"use strict";

const PROFILES = Object.freeze(["notebook", "post", "topic", "wiki"]);

function deepFreeze(value) {
  if (value == null || typeof value !== "object" || Object.isFrozen(value)) return value;
  Object.values(value).forEach(deepFreeze);
  return Object.freeze(value);
}

function literal(value) {
  return { kind: "literal", value };
}

function derived(...from) {
  return { kind: "derived", from };
}

function inherited(...from) {
  return { kind: "inherited", from };
}

function computed(description) {
  return { kind: "computed", description };
}

function omitted() {
  return { kind: "omitted" };
}

function defaultExample(types) {
  if (types.includes("string")) return "example";
  if (types.includes("boolean")) return true;
  if (types.includes("number")) return 1;
  if (types.includes("array")) return [];
  if (types.includes("object")) return {};
  return null;
}

function createFieldFactory(scope, consumers) {
  function field(type, options = {}) {
    const types = Array.isArray(type) ? type : [type];
    return {
      type: types,
      default: Object.prototype.hasOwnProperty.call(options, "default")
        ? options.default
        : options.required === true
          ? computed("由构建期模型归一化")
          : omitted(),
      scope,
      consumers: options.consumers || consumers,
      example: Object.prototype.hasOwnProperty.call(options, "example")
        ? options.example
        : defaultExample(types),
      required: options.required === true,
      ...(options.reference ? { reference: options.reference } : {}),
      ...(options.properties ? { properties: options.properties } : {}),
      ...(options.items ? { items: options.items } : {}),
      ...(options.additionalProperties ? { additionalProperties: true } : {})
    };
  }

  function object(properties, options = {}) {
    return field("object", {
      default: Object.prototype.hasOwnProperty.call(options, "default")
        ? options.default
        : options.required === true ? literal({}) : omitted(),
      example: Object.prototype.hasOwnProperty.call(options, "example") ? options.example : {},
      properties,
      required: options.required,
      consumers: options.consumers,
      reference: options.reference,
      additionalProperties: options.additionalProperties
    });
  }

  function array(items, options = {}) {
    return field("array", {
      default: Object.prototype.hasOwnProperty.call(options, "default")
        ? options.default
        : options.required === true ? literal([]) : omitted(),
      example: Object.prototype.hasOwnProperty.call(options, "example") ? options.example : [],
      items,
      required: options.required
    });
  }

  return { array, field, object };
}

function brandSchema(factory, options = {}) {
  const { field, object } = factory;
  return object({
    image: object({
      src: field("string", { example: "/images/avatar.webp" }),
      style: field("string", { example: "avatar" }),
      url: field("string", { example: "/about/" }),
      background: field("string", { example: "var(--block)" })
    }, { example: { src: "/images/avatar.webp", style: "avatar" } }),
    name: field("string", {
      default: options.nameDefault || derived("site.title"),
      example: "Stellar",
      required: options.requiredName === true
    }),
    tagline: field("string", {
      default: options.taglineDefault || derived("site.subtitle"),
      example: "每个人的独立博客",
      required: options.requiredTagline === true
    }),
    url: field("string", { example: "/" })
  }, {
    default: options.default || (options.requiredName
      ? derived("theme.brand", "site.title", "site.subtitle")
      : omitted()),
    example: { name: "Stellar", tagline: "每个人的独立博客", url: "/" }
  });
}

function identitySchema(factory) {
  const { field, object } = factory;
  return object({
    name: field("string", { default: literal(""), example: "Stellar", required: true }),
    headline: field("string", { default: derived("collection.name"), example: "每个人的独立博客", required: true }),
    tagline: field("string", { default: literal(""), example: "基于 Hexo 的全能型主题", required: true }),
    description: field("string", { default: literal(""), example: "Stellar 项目文档", required: true }),
    audience: field("string", { default: literal(""), example: "独立博主", required: true }),
    icon: field("string", { default: literal(""), example: "/stellar.svg", required: true })
  }, {
    default: derived("collection.name", "collection.headline", "collection.identity.icon"),
    example: { name: "Stellar", headline: "每个人的独立博客", icon: "/stellar.svg" },
    required: true
  });
}

function sourceSchema(factory, options = {}) {
  const { field, object } = factory;
  return object({
    ...(options.includeFile ? {
      file: field("string", { default: derived("page.source"), example: "_posts/hello.md", required: true })
    } : {}),
    repository: field("string", { example: "xaoxuu/hexo-theme-stellar" }),
    branch: field("string", { example: "v2" })
  }, {
    default: options.default || literal({}),
    example: options.includeFile
      ? { file: "_posts/hello.md", repository: "xaoxuu/hexo-theme-stellar", branch: "v2" }
      : { repository: "xaoxuu/hexo-theme-stellar", branch: "v2" },
    required: options.required === true
  });
}

function navigationSchema(factory, extension = {}) {
  const { field, object } = factory;
  return object({
    menu: field("string", { example: "post" }),
    breadcrumb: field("boolean", { example: true }),
    ...extension
  }, {
    default: inherited("profile.navigation", "collection.navigation", "page.navigation"),
    example: { menu: "post", breadcrumb: true },
    required: true
  });
}

function sidebarSchema(factory) {
  const { array, field, object } = factory;
  const widget = field(["string", "object"], {
    default: computed("由 widgets 数组逐项提供"),
    example: "toc",
    additionalProperties: true
  });
  return object({
    left: object({
      widgets: array(widget, { example: ["recent", "toc"] }),
      search: field(["boolean", "object"], {
        example: { filter: "wiki", placeholder: "搜索文档" },
        properties: {
          filter: field("string", { example: "wiki" }),
          placeholder: field("string", { example: "搜索文档" })
        }
      }),
      menu: field("boolean", { example: true }),
      brand: brandSchema(factory),
      wiki_home: field("boolean", { example: true })
    }, { example: { widgets: ["recent"] } }),
    right: object({
      widgets: array(widget, { example: ["toc"] })
    }, { example: { widgets: ["toc"] } })
  }, {
    default: inherited("profile.sidebar", "collection.sidebar", "page.sidebar"),
    example: { left: { widgets: ["recent"] }, right: { widgets: ["toc"] } }
  });
}

function cardSchema(factory) {
  const { field, object } = factory;
  return object({
    cover: field("string", { example: "/cover.webp" }),
    tagline: field("string", { example: "开始阅读" })
  }, { example: { cover: "/cover.webp" } });
}

function bannerSchema(factory) {
  const { field, object } = factory;
  return object({
    enabled: field("boolean", { example: true }),
    image: field("string", { example: "/banner.webp" }),
    avatar: field("string", { example: "/avatar.webp" }),
    headline: field("string", { example: "开始使用 Stellar" }),
    tagline: field("string", { example: "十分钟搭好站点" })
  }, { example: { enabled: true, image: "/banner.webp" } });
}

function heroSchema(factory, options = {}) {
  const { array, field, object } = factory;
  const command = object({
    label: field("string", { example: "安装" }),
    codes: field("string", { example: "npm install hexo-theme-stellar" })
  }, { example: { label: "安装", codes: "npm install hexo-theme-stellar" } });
  const action = object({
    title: field("string", { example: "开始使用" }),
    url: field("string", { example: "/wiki/stellar/" }),
    icon: field("string", { example: "solar:rocket-bold-duotone" })
  }, { example: { title: "开始使用", url: "/wiki/stellar/" } });
  return object({
    enabled: field("boolean", { example: true }),
    background: object({
      image: field("string", { example: "/hero.webp", consumers: options.pathConsumers }),
      effect: object({
        type: field("string", { example: "galaxy" }),
        options: field("object", {
          example: { starSpeed: 0.5 },
          additionalProperties: true
        }),
        runtime: object({
          pause_when_hidden: field("boolean", { example: true }),
          respect_reduced_motion: field("boolean", { example: true })
        }, { example: { pause_when_hidden: true } })
      }, { example: { type: "galaxy", options: { starSpeed: 0.5 } } })
    }, {
      example: { image: "/hero.webp" },
      consumers: options.pathConsumers
    }),
    preview: object({
      type: field("string", { example: "terminal" }),
      src: field("string", { example: "/preview.webp" }),
      alt: field("string", { example: "Stellar 预览" }),
      commands: array(command, { example: [{ label: "安装", codes: "npm install hexo-theme-stellar" }] })
    }, { example: { type: "image", src: "/preview.webp" } }),
    actions: array(action, { example: [{ title: "开始使用", url: "/wiki/stellar/" }] })
  }, {
    default: literal({}),
    example: { enabled: true, background: { image: "/hero.webp" } },
    consumers: options.pathConsumers
  });
}

function articleSchema(factory) {
  const { field, object } = factory;
  return object({
    type: field("string", { default: inherited("theme.article.type"), example: "tech" }),
    indent: field("boolean", { default: inherited("theme.article.indent"), example: false }),
    author: field("string", { example: "xaoxuu" }),
    ai_label: field(["string", "object"], {
      default: inherited("theme.article.ai_label", "page.article.ai_label"),
      example: "reviewed",
      additionalProperties: true
    })
  }, { default: inherited("theme.article", "collection.article", "page.article"), example: { type: "tech", indent: false } });
}

function footerSchema(factory, options = {}) {
  const { array, field, object } = factory;
  return object({
    references: array(field("any", {
      default: computed("由 references 数组逐项提供"),
      example: { title: "Hexo", url: "https://hexo.io/" },
      additionalProperties: true
    }), { default: literal([]), example: [] }),
    license: field(["boolean", "string", "null"], {
      default: options.licenseDefault || inherited("theme.article.license"),
      example: "CC BY-NC-SA 4.0"
    }),
    share: field(["boolean", "array", "null"], {
      default: options.shareDefault || inherited("theme.article.share"),
      example: true
    })
  }, { default: inherited("theme.article", "collection.footer", "page.footer"), example: { references: [], share: true } });
}

function commentsSchema(factory) {
  const { field, object } = factory;
  const properties = {
    enabled: field("boolean", { default: inherited("theme.comments.enabled"), example: true }),
    title: field("string", { default: derived("theme.comments.title", "theme.comments.comment_title"), example: "参与讨论" }),
    id: field("string", { example: "post-hello" }),
    service: field("string", { default: inherited("theme.comments.service"), example: "giscus" })
  };
  for (const service of ["beaudar", "utterances", "giscus", "twikoo", "waline", "artalk"]) {
    properties[service] = field("object", {
      example: service === "giscus" ? { "data-repo": "xaoxuu/xaoxuu.com" } : {},
      additionalProperties: true
    });
  }
  return object(properties, {
    default: inherited("theme.comments", "collection.comments", "page.comments"),
    example: { enabled: true, service: "giscus" }
  });
}

function presentationSchema(factory, options = {}) {
  const cascadeFactory = options.cascadeFactory || factory;
  const properties = {
    ...(options.includeCard ? { card: cardSchema(cascadeFactory) } : {}),
    ...(options.includeHero ? { hero: heroSchema(factory, { pathConsumers: options.heroConsumers }) } : {}),
    ...(options.includeBanner ? { banner: bannerSchema(factory) } : {}),
    sidebar: sidebarSchema(cascadeFactory),
    article: articleSchema(cascadeFactory),
    footer: footerSchema(cascadeFactory),
    comments: commentsSchema(cascadeFactory)
  };
  for (const value of Object.values(properties)) value.required = true;
  return cascadeFactory.object(properties, {
    default: inherited("profile.presentation", "collection.presentation", "page.presentation"),
    example: { article: { type: "tech", indent: false }, footer: { references: [] } },
    required: true
  });
}

function visibilitySchema(factory, options = {}) {
  const { field, object } = factory;
  return object({
    listed: field("boolean", { default: options.listedDefault || literal(true), example: true, required: true }),
    searchable: field("boolean", { default: options.searchableDefault || literal(true), example: true, required: true })
  }, { default: literal({ listed: true, searchable: true }), example: { listed: true, searchable: true }, required: true });
}

function collectionSchema(profile) {
  const scope = `CollectionModel:${profile}`;
  const factory = createFieldFactory(scope, ["PageViewModel", "Reference generator"]);
  const cascadeFactory = createFieldFactory(scope, ["ContentItemModel", "PageViewModel", "Reference generator"]);
  const wikiHeroConsumers = ["buildWikiPageViewModel", "PageViewModel", "Reference generator"];
  const { array, field, object } = factory;
  const required = value => {
    value.required = true;
    return value;
  };

  const routeProperties = {
    baseDir: field("string", { default: derived("profile.base_dir", "collection.routing.base_dir"), example: profile === "post" ? "blog" : `${profile}/example`, required: true })
  };
  if (profile === "wiki") {
    routeProperties.homepage = field("string", { default: literal(""), example: "wiki/stellar", required: true });
  }
  if (profile === "topic") {
    routeProperties.path = field("string", { default: derived("collection.routing.path"), example: "topic/stellar-v2", required: true });
    routeProperties.start = field("string", { default: literal(""), example: "topic/stellar-v2/start", required: true });
  }

  let navigationExtension = {};
  if (profile === "wiki") {
    const treeItem = object({
      id: field("string", { default: derived("page._id", "page.path"), example: "wiki-start", required: true }),
      title: field("string", { default: literal(""), example: "开始", required: true }),
      path: field("string", { default: literal(""), example: "wiki/stellar", required: true }),
      pageNumber: field(["number", "null"], { default: literal(null), example: 0, required: true }),
      isHomepage: field("boolean", { default: literal(false), example: true, required: true })
    }, { example: { id: "wiki-start", title: "开始", path: "wiki/stellar", pageNumber: 0, isHomepage: true } });
    const treeSection = object({
      title: field("string", { default: literal(""), example: "快速开始", required: true }),
      items: array(treeItem, { example: [{ id: "wiki-start", title: "开始", path: "wiki/stellar", pageNumber: 0, isHomepage: true }], required: true })
    }, { example: { title: "快速开始", items: [] } });
    navigationExtension.tree = array(treeSection, { example: [{ title: "快速开始", items: [] }], required: true });
  }
  if (profile === "topic") {
    const seriesItem = object({
      id: field("string", { default: derived("page._id", "page.path"), example: "alpha-1", required: true }),
      title: field("string", { default: literal(""), example: "Alpha 1", required: true }),
      path: field("string", { default: literal(""), example: "posts/alpha-1", required: true }),
      date: field(["string", "null"], { default: literal(null), example: "2026-08-22T00:00:00.000Z", required: true }),
      current: field("boolean", { default: literal(false), example: true, required: true })
    }, { example: { id: "alpha-1", title: "Alpha 1", path: "posts/alpha-1", date: "2026-08-22T00:00:00.000Z", current: true } });
    navigationExtension.series = array(seriesItem, { example: [], required: true });
  }
  if (profile === "notebook") {
    const tagItem = object({
      id: field("string", { default: computed("由标签层级名称转为小写"), example: "tools/cli", required: true }),
      name: field("string", { default: literal(""), example: "Tools/CLI", required: true }),
      label: field("string", { default: literal(""), example: "CLI", required: true }),
      path: field("string", { default: computed("由集合路由与标签 id 生成"), example: "notes/dev/tags/tools/cli", required: true }),
      parentId: field(["string", "null"], { default: literal(null), example: "tools", required: true })
    }, { example: { id: "tools/cli", name: "Tools/CLI", label: "CLI", path: "notes/dev/tags/tools/cli", parentId: "tools" } });
    navigationExtension.tags = array(tagItem, { example: [], required: true });
  }

  const listingProperties = profile === "post"
    ? {
        pinStyle: field(["string", "null"], { default: inherited("theme.article.pin_style"), example: "carousel", required: true }),
        cardStyle: field(["string", "null"], { default: inherited("theme.article.card_style"), example: "classic", required: true }),
        excerptLength: field(["number", "null"], { default: inherited("theme.article.auto_excerpt"), example: 128, required: true })
      }
    : {
        priority: field("number", { default: literal(0), example: 0, required: true }),
        sort: field(["number", "null"], { default: profile === "topic" ? literal(null) : literal(0), example: 0, required: true }),
        excerptLength: field(["number", "null"], {
          default: profile === "notebook" ? inherited("theme.notebook.listing.excerpt_length") : literal(null),
          example: 128,
          required: true
        }),
        perPage: field(["number", "null"], {
          default: profile === "notebook" ? inherited("theme.notebook.listing.per_page", "site.per_page") : literal(null),
          example: 10,
          required: true
        }),
        orderBy: field(["string", "null"], {
          default: profile === "topic" ? literal("-date") : profile === "notebook" ? literal("-updated") : literal(null),
          example: "-updated",
          required: true
        })
      };

  const properties = {
    id: field("string", { default: profile === "post" ? literal("post") : derived("collection.id"), example: profile === "post" ? "post" : "stellar", required: true }),
    profile: field("string", { default: literal(profile), example: profile, required: true }),
    identity: required(profile === "post"
      ? brandSchema(factory, { requiredName: true, requiredTagline: true })
      : identitySchema(factory)),
    source: sourceSchema(cascadeFactory, { required: true }),
    route: object(routeProperties, { default: derived("profile.route", "collection.routing"), example: { baseDir: profile === "post" ? "blog" : `${profile}/stellar` }, required: true }),
    navigation: navigationSchema(cascadeFactory, navigationExtension),
    listing: object(listingProperties, { default: inherited("profile.listing", "collection.listing"), example: {}, required: true }),
    presentation: presentationSchema(factory, {
      includeCard: profile !== "post",
      includeHero: profile !== "post",
      cascadeFactory,
      heroConsumers: profile === "wiki" ? wikiHeroConsumers : undefined
    }),
    visibility: visibilitySchema(profile === "post" ? cascadeFactory : factory, {
      listedDefault: profile === "wiki" || profile === "topic" ? derived("collection publish state") : literal(true)
    })
  };
  return object(properties, { required: true, example: { id: profile === "post" ? "post" : "stellar", profile } });
}

function contentItemSchema() {
  const factory = createFieldFactory("ContentItemModel", ["PageViewModel", "Reference generator"]);
  const { array, field, object } = factory;
  const stringItem = field("string", { default: computed("由数组逐项归一化"), example: "Hexo" });
  const properties = {
    id: field("string", { default: derived("page._id", "page.source", "page.path"), example: "post-hello", required: true }),
    title: field("string", { default: derived("page.title", "frontMatter.title"), example: "Hello Stellar", required: true }),
    layout: field("string", { default: literal("post"), example: "post", required: true }),
    content: field("string", { default: literal(""), example: "<p>Hello</p>", required: true }),
    excerpt: field("string", { default: literal(""), example: "<p>Hello</p>", required: true }),
    date: field(["string", "null"], { default: literal(null), example: "2026-08-22T00:00:00.000Z", required: true }),
    updated: field(["string", "null"], { default: derived("page.updated", "page.date"), example: "2026-08-22T00:00:00.000Z", required: true }),
    tags: array(stringItem, { default: literal([]), example: ["Hexo"], required: true }),
    categories: array(stringItem, { default: literal([]), example: ["开发"], required: true }),
    source: sourceSchema(factory, { includeFile: true, default: inherited("collection.source", "page.source"), required: true }),
    route: object({
      path: field("string", { default: literal(""), example: "posts/hello", required: true }),
      permalink: field("string", { default: literal(""), example: "https://example.com/posts/hello/", required: true })
    }, { default: derived("page.path", "page.permalink"), example: { path: "posts/hello", permalink: "https://example.com/posts/hello/" }, required: true }),
    navigation: navigationSchema(factory),
    listing: object({
      priority: field("number", { default: literal(0), example: 0, required: true })
    }, { default: literal({ priority: 0 }), example: { priority: 0 }, required: true }),
    presentation: presentationSchema(factory, { includeCard: true, includeBanner: true }),
    visibility: visibilitySchema(factory, {
      listedDefault: inherited("collection.visibility.listed", "page.visibility.listed"),
      searchableDefault: inherited("collection.visibility.searchable", "page.visibility.searchable")
    })
  };
  return object(properties, { required: true, example: { id: "post-hello", title: "Hello Stellar", layout: "post" } });
}

function pageViewModelSchema(profile) {
  const factory = createFieldFactory(`PageViewModel:${profile}`, ["page.viewModel", "Reference generator"]);
  const { array, field, object } = factory;
  const properties = {
    collection: object({}, {
      default: computed("由当前 profile 的 CollectionModel 构建器生成"),
      example: { id: "post", profile: "post" },
      reference: "CollectionModel",
      required: true
    }),
    item: object({}, {
      default: computed("由 ContentItemModel 构建器生成"),
      example: { id: "post-hello", title: "Hello Stellar", layout: "post" },
      reference: "ContentItemModel",
      required: true
    })
  };

  if (profile === "post") {
    const stringItem = field("string", {
      default: computed("由构建期数组逐项归一化"),
      example: "Stellar"
    });
    const breadcrumbItem = object({
      name: field("string", { default: literal(""), example: "思考", required: true }),
      path: field("string", { default: literal(""), example: "blog/categories/thinking", required: true })
    }, { example: { name: "思考", path: "blog/categories/thinking" } });
    const openGraph = field(["object", "null"], {
      default: computed("由 theme.open_graph 与页面 open_graph 生成；禁用时为 null"),
      example: {
        args: { image: "/cover.webp", twitter_card: "summary_large_image" },
        title: "Hello Stellar",
        siteName: "Stellar",
        twitterTitle: "Hello Stellar"
      },
      required: true,
      properties: {
        args: field("object", { example: { image: "/cover.webp" }, required: true, additionalProperties: true }),
        title: field("string", { example: "Hello Stellar", required: true }),
        siteName: field("string", { example: "Stellar", required: true }),
        twitterTitle: field("string", { example: "Hello Stellar", required: true }),
        publishedTime: field(["string", "null"], { example: "2026-08-22T00:00:00.000Z", required: true }),
        modifiedTime: field(["string", "null"], { example: "2026-08-22T00:00:00.000Z", required: true }),
        tags: array(stringItem, { default: literal([]), example: ["Hexo"], required: true })
      }
    });
    const renderBrand = brandSchema(factory);
    renderBrand.required = true;
    const postLink = field(["object", "null"], {
      default: computed("由 Hexo prev/next 关系规范化；不存在时为 null"),
      example: { title: "上一篇", path: "blog/previous", date: "2026-08-21T00:00:00.000Z" },
      required: true,
      properties: {
        title: field("string", { default: literal(""), example: "上一篇", required: true }),
        path: field("string", { default: literal(""), example: "blog/previous", required: true }),
        date: field(["string", "null"], { default: literal(null), example: "2026-08-21T00:00:00.000Z", required: true })
      }
    });
    const tagLink = object({
      name: field("string", { default: literal(""), example: "Hexo", required: true }),
      path: field("string", { default: literal(""), example: "tags/hexo", required: true })
    }, { example: { name: "Hexo", path: "tags/hexo" } });
    const relatedItem = object({
      title: field("string", { default: literal(""), example: "Related Post", required: true }),
      path: field("string", { default: literal(""), example: "/blog/related/", required: true }),
      excerpt: field("string", { default: literal(""), example: "Related excerpt", required: true })
    }, { example: { title: "Related Post", path: "/blog/related/", excerpt: "Related excerpt" } });
    const share = field(["object", "null"], {
      default: computed("由最终 footer.share 与文章分享数据生成；禁用时为 null"),
      example: { services: ["link"], permalink: "https://example.com/blog/hello/", title: "Hello - Stellar" },
      required: true,
      properties: {
        services: array(stringItem, { default: literal([]), example: ["wechat", "link"], required: true }),
        permalink: field("string", { default: inherited("item.route.permalink"), example: "https://example.com/blog/hello/", required: true }),
        title: field("string", { default: computed("由文章标题与站点标题组合"), example: "Hello - Stellar", required: true }),
        image: field("string", { default: inherited("item.presentation.card.cover"), example: "/cover.webp", required: true }),
        summary: field("string", { default: computed("由 description/excerpt/content 截断"), example: "文章摘要", required: true })
      }
    });
    const contributor = field(["object", "null"], {
      default: computed("由 data_services.contributors.edit_this_page 与源文件生成"),
      example: { editUrl: "https://github.com/example/repo/blob/main/post.md", commitsUrl: "https://api.github.com/repos/example/repo/commits?path=post.md" },
      required: true,
      properties: {
        editUrl: field("string", { default: literal(""), example: "https://github.com/example/repo/blob/main/post.md", required: true }),
        commitsUrl: field("string", { default: literal(""), example: "https://api.github.com/repos/example/repo/commits?path=post.md", required: true })
      }
    });
    properties.render = object({
      document: object({
        language: field("string", { default: derived("page.lang", "page.language", "site.language"), example: "zh-CN", required: true }),
        headInject: array(stringItem, { default: literal([]), example: [], required: true }),
        preferredTheme: field("string", { default: derived("theme.style.prefers_theme"), example: "auto", required: true })
      }, { required: true, example: { language: "zh-CN", headInject: [], preferredTheme: "auto" } }),
      layout: object({
        pageType: field("string", { default: literal("content"), example: "content", required: true }),
        articleType: field(["string", "null"], { default: inherited("item.presentation.article.type"), example: "tech", required: true }),
        indent: field("boolean", { default: inherited("item.presentation.article.indent", "articleType === story"), example: false, required: true }),
        siteBackground: field("boolean", { default: derived("theme.style.site.background-image"), example: false, required: true }),
        leftbarSurface: field("string", { default: derived("theme.style.leftbar.ui-style"), example: "glass", required: true }),
        leftbarBlur: field("boolean", { default: derived("theme.style.leftbar.blur"), example: false, required: true }),
        blogPath: field("string", { default: derived("site.index_generator.path"), example: "blog", required: true }),
        brand: renderBrand,
        breadcrumbs: array(breadcrumbItem, { default: literal([]), example: [{ name: "思考", path: "blog/categories/thinking" }], required: true })
      }, { required: true, example: { pageType: "content", articleType: "tech", indent: false, blogPath: "blog", brand: {}, breadcrumbs: [] } }),
      seo: object({
        title: field("string", { default: computed("由文章标题与站点标题组合"), example: "Hello Stellar - Stellar", required: true }),
        description: field("string", { default: derived("page.description", "item.excerpt", "item.content"), example: "文章摘要", required: true }),
        keywords: array(stringItem, { default: derived("page.keywords", "item.tags", "site.keywords"), example: ["Hexo", "Stellar"], required: true }),
        robots: field(["string", "null"], { default: derived("IS_BACKUP", "page.robots"), example: "noindex, nofollow", required: true }),
        canonical: field(["string", "null"], { default: derived("hexo.stellar.config.canonical.originalHost", "item.route.path"), example: "https://example.com/blog/hello/", required: true }),
        openGraph,
        jsonLd: field("object", { default: computed("由 BlogPosting 结构化数据规则生成"), example: { "@type": "BlogPosting" }, required: true, additionalProperties: true })
      }, { required: true, example: { title: "Hello Stellar - Stellar", description: "文章摘要", keywords: ["Hexo"], robots: null, canonical: null, openGraph: null, jsonLd: { "@type": "BlogPosting" } } }),
      article: object({
        heti: field("boolean", { default: derived("theme.plugins.heti.enable"), example: false, required: true }),
        tags: array(tagLink, { default: computed("由 Hexo 标签关系规范化；theme.article.tags 禁用时为空"), example: [{ name: "Hexo", path: "tags/hexo" }], required: true }),
        footer: object({
          references: array(field("any", { additionalProperties: true }), { default: inherited("item.presentation.footer.references"), example: [], required: true }),
          license: field("string", { default: computed("由最终许可协议与作者信息生成"), example: "CC BY 4.0", required: true }),
          share,
          contributor
        }, { required: true, example: { references: [], license: "", share: null, contributor: null } }),
        previous: postLink,
        next: postLink,
        related: object({
          enabled: field("boolean", { default: derived("theme.article.related_posts.enable"), example: false, required: true }),
          title: field("string", { default: literal(""), example: "Related Posts", required: true }),
          maxCount: field("number", { default: literal(5), example: 5, required: true }),
          items: array(relatedItem, { default: literal([]), example: [], required: true })
        }, { required: true, example: { enabled: false, title: "", maxCount: 5, items: [] } }),
        comments: object({
          enabled: field("boolean", { default: computed("由最终 comments.enabled 与 service 生成"), example: true, required: true }),
          title: field("string", { default: inherited("item.presentation.comments.title"), example: "参与讨论", required: true }),
          id: field("string", { default: inherited("item.presentation.comments.id"), example: "post-hello", required: true }),
          service: field("string", { default: inherited("item.presentation.comments.service"), example: "giscus", required: true }),
          options: field("object", { default: computed("由激活服务参数袋生成"), example: { "data-repo": "example/repo" }, required: true, additionalProperties: true }),
          pageTitle: field("string", { default: inherited("item.title"), example: "Hello Stellar", required: true })
        }, { required: true, example: { enabled: true, title: "参与讨论", id: "", service: "giscus", options: {}, pageTitle: "Hello Stellar" } })
      }, { required: true, example: { heti: false, tags: [], footer: {}, previous: null, next: null, related: {}, comments: {} } }),
      listing: object({
        href: field("string", { default: derived("page.link", "item.route.path"), example: "blog/hello", required: true }),
        title: field("string", { default: inherited("item.title"), example: "Hello Stellar", required: true }),
        layout: field("string", { default: inherited("item.layout"), example: "post", required: true }),
        date: field(["string", "null"], { default: inherited("item.date"), example: "2026-08-22T00:00:00.000Z", required: true }),
        cover: field("string", { default: inherited("item.presentation.card.cover"), example: "/cover.webp", required: true }),
        caption: field("string", { default: computed("由 card.tagline/description/excerpt/content 生成"), example: "文章说明", required: true }),
        excerpt: field("string", { default: computed("由 excerpt/description/content 和列表长度生成"), example: "文章摘要", required: true }),
        categories: array(stringItem, { default: inherited("item.categories"), example: ["开发"], required: true }),
        categoryStyle: field("string", { default: derived("theme.article.category_color"), example: "--text-p2:#f44336;--theme-block:#f4433620", required: true }),
        tags: array(stringItem, { default: computed("theme.article.card_tags 启用时最多五项"), example: ["Hexo"], required: true }),
        authorId: field("string", { default: derived("item.presentation.article.author", "theme.default_author.id"), example: "xaoxuu", required: true }),
        priority: field("number", { default: inherited("item.listing.priority"), example: 1, required: true }),
        listed: field("boolean", { default: inherited("item.visibility.listed"), example: true, required: true }),
        cardStyle: field("string", { default: inherited("collection.listing.cardStyle"), example: "hero", required: true })
      }, { required: true, example: { href: "blog/hello", title: "Hello Stellar", layout: "post", date: null, cover: "", caption: "", excerpt: "", categories: [], categoryStyle: "", tags: [], authorId: "", priority: 0, listed: true, cardStyle: "classic" } })
    }, {
      default: computed("由 Post PageViewModel 构建器生成"),
      example: { document: { language: "zh-CN", headInject: [] }, layout: { pageType: "content" }, seo: { title: "Hello Stellar - Stellar" } },
      required: true
    });
  }

  return object(properties, {
    required: true,
    example: profile === "post"
      ? { collection: { id: "post", profile: "post" }, item: { id: "post-hello" }, render: { document: {}, layout: {}, seo: {} } }
      : { collection: { id: profile, profile }, item: { id: `${profile}-hello` } }
  });
}

const MODEL_SCHEMAS = deepFreeze({
  CollectionModel: {
    profiles: Object.fromEntries(PROFILES.map(profile => [profile, collectionSchema(profile)]))
  },
  ContentItemModel: {
    schema: contentItemSchema()
  },
  PageViewModel: {
    profiles: Object.fromEntries(PROFILES.map(profile => [profile, pageViewModelSchema(profile)]))
  }
});

module.exports = {
  MODEL_SCHEMAS,
  PROFILES,
  computed,
  derived,
  inherited,
  literal,
  omitted
};
