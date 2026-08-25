/* global hexo */
"use strict";

const { deepFreeze } = require("./schema-utils");

const PROFILES = Object.freeze(["notebook", "post", "topic", "wiki"]);

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
      src: field(["string", "null"], { example: "/images/avatar.webp" }),
      variant: field("string", { example: "avatar" }),
      href: field(["string", "null"], { example: "/about/" })
    }, { example: { src: "/images/avatar.webp", variant: "avatar" } }),
    name: field(["string", "null"], {
      default: options.nameDefault || derived("site.title"),
      example: "Stellar",
      required: options.requiredName === true
    }),
    wordmark: field(["string", "null"], { example: "/wordmark.svg" }),
    tagline: object({
      text: field(["string", "null"], { example: "每个人的独立博客" }),
      hover: field(["string", "null"], { example: "example.com" })
    }, {
      default: options.taglineDefault || derived("site.subtitle"),
      example: { text: "每个人的独立博客", hover: null },
      required: options.requiredTagline === true
    }),
    href: field(["string", "null"], { example: "/" })
  }, {
    default: options.default || (options.requiredName
      ? derived("hexo.stellar.config.site.brand")
      : omitted()),
    example: { name: "Stellar", tagline: { text: "每个人的独立博客", hover: null }, href: "/" }
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
      wikiHome: field("boolean", { example: true })
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
          pauseWhenHidden: field("boolean", { example: true }),
          respectReducedMotion: field("boolean", { example: true })
        }, { example: { pauseWhenHidden: true } })
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
    style: field("string", { default: inherited("hexo.stellar.config.content.article.style"), example: "tech" }),
    paragraphIndent: field("string", { default: inherited("hexo.stellar.config.content.article.paragraphIndent"), example: "auto" }),
    author: field("string", { example: "xaoxuu" }),
    aiLabel: field(["string", "null"], { default: inherited("collection.article.aiLabel", "page.article.aiLabel"), example: "reviewed" })
  }, { default: inherited("hexo.stellar.config.content.article", "collection.article", "page.article"), example: { style: "tech", paragraphIndent: "auto" } });
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
      default: options.licenseDefault || inherited("hexo.stellar.config.content.article.footer.license"),
      example: "CC BY-NC-SA 4.0"
    }),
    share: field(["boolean", "array", "null"], {
      default: options.shareDefault || inherited("hexo.stellar.config.content.article.footer.share"),
      example: true
    }),
    showTags: field(["boolean", "null"], { default: inherited("hexo.stellar.config.content.article.footer.showTags"), example: true })
  }, { default: inherited("hexo.stellar.config.content.article.footer", "collection.footer", "page.footer"), example: { references: [], share: true } });
}

function commentsSchema(factory) {
  const { field, object } = factory;
  const properties = {
    enabled: field("boolean", { default: computed("provider 非空时默认启用，可由 collection/page comments.enabled 覆盖"), example: true }),
    title: field(["string", "null"], { default: inherited("hexo.stellar.config.extensions.comments.title"), example: "参与讨论" }),
    id: field("string", { example: "post-hello" }),
    provider: field(["string", "null"], { default: inherited("hexo.stellar.config.extensions.comments.provider"), example: "giscus" }),
    options: field("object", { example: { "data-repo": "xaoxuu/xaoxuu.com" }, additionalProperties: true })
  };
  return object(properties, {
    default: inherited("hexo.stellar.config.extensions.comments", "collection.comments", "page.comments"),
    example: { enabled: true, provider: "giscus", options: { "data-repo": "xaoxuu/xaoxuu.com" } }
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
    example: { article: { style: "tech", paragraphIndent: "auto" }, footer: { references: [] } },
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
    baseDir: field("string", { default: derived("profile.path", "collection.route.path"), example: profile === "post" ? "blog" : `${profile}/example`, required: true })
  };
  if (profile === "wiki") {
    routeProperties.homepage = field("string", { default: literal(""), example: "wiki/stellar", required: true });
  }
  if (profile === "topic") {
    routeProperties.path = field("string", { default: derived("collection.route.path"), example: "topic/stellar-v2", required: true });
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
        pinStyle: field(["string", "null"], { default: inherited("hexo.stellar.config.content.article.listing.pinnedLayout"), example: "carousel", required: true }),
        cardStyle: field(["string", "null"], { default: inherited("hexo.stellar.config.content.article.listing.cardLayout"), example: "hero", required: true }),
        excerptLength: field(["number", "null"], { default: inherited("hexo.stellar.config.content.article.listing.excerptLength"), example: 128, required: true })
      }
    : {
        priority: field("number", { default: literal(0), example: 0, required: true }),
        order: field(["number", "null"], { default: profile === "topic" ? literal(null) : literal(0), example: 0, required: true }),
        excerptLength: field(["number", "null"], {
          default: profile === "notebook" ? inherited("hexo.stellar.config.content.notebook.listing.excerptLength") : literal(null),
          example: 128,
          required: true
        }),
        perPage: field(["number", "null"], {
          default: profile === "notebook" ? inherited("hexo.stellar.config.content.notebook.listing.perPage", "site.per_page") : literal(null),
          example: 10,
          required: true
        }),
        ...(profile === "wiki" ? {} : {
          sort: object({
            field: field("string", { default: profile === "topic" ? literal("date") : literal("updated"), example: "updated", required: true }),
            direction: field("string", { default: literal("desc"), example: "desc", required: true })
          }, { default: derived("collection.listing.sort", "content.notebook.listing.sort"), example: { field: "updated", direction: "desc" }, required: true })
        })
      };

  const properties = {
    id: field("string", { default: profile === "post" ? literal("post") : derived("collection.id"), example: profile === "post" ? "post" : "stellar", required: true }),
    profile: field("string", { default: literal(profile), example: profile, required: true }),
    identity: required(profile === "post"
      ? brandSchema(factory, { requiredName: true, requiredTagline: true })
      : identitySchema(factory)),
    source: sourceSchema(cascadeFactory, { required: true }),
    route: object(routeProperties, { default: derived("profile.route", "collection.route"), example: { baseDir: profile === "post" ? "blog" : `${profile}/stellar` }, required: true }),
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

  if (profile === "post" || profile === "topic") {
    const stringItem = field("string", {
      default: computed("由构建期数组逐项归一化"),
      example: "Stellar"
    });
    const breadcrumbItem = object({
      name: field("string", { default: literal(""), example: "思考", required: true }),
      path: field("string", { default: literal(""), example: "blog/categories/thinking", required: true })
    }, { example: { name: "思考", path: "blog/categories/thinking" } });
    const openGraph = field(["object", "null"], {
      default: computed("由 hexo.stellar.config.seo.openGraph 与页面 Open Graph 覆盖生成；禁用时为 null"),
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
      default: computed("由选中的 extensions.services.contributors provider 按最长 source_prefix 匹配与源文件生成"),
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
        headEndInject: field("string", { default: literal(""), example: "", required: true }),
        bodyEndInject: field("string", { default: literal(""), example: "", required: true }),
        preferredTheme: field("string", { default: derived("hexo.stellar.config.appearance.colorScheme"), example: "auto", required: true })
      }, { required: true, example: { language: "zh-CN", headEndInject: "", bodyEndInject: "", preferredTheme: "auto" } }),
      layout: object({
        pageType: field("string", { default: literal("content"), example: "content", required: true }),
        articleStyle: field(["string", "null"], { default: inherited("item.presentation.article.style"), example: "tech", required: true }),
        indent: field("boolean", { default: computed("由 article.paragraphIndent 与 style 解析"), example: false, required: true }),
        siteBackground: field("boolean", { default: derived("hexo.stellar.config.appearance.backgrounds.page.image"), example: false, required: true }),
        leftbarSurface: field("string", { default: derived("hexo.stellar.config.appearance.backgrounds.sidebar.surface"), example: "glass", required: true }),
        leftbarBlur: field("boolean", { default: computed("v2 appearance 不再公开 sidebar blur 开关"), example: false, required: true }),
        blogPath: field("string", { default: derived("site.index_generator.path"), example: "blog", required: true }),
        brand: renderBrand,
        ...(profile === "topic" ? {
          sidebar: field("object", {
            default: inherited("item.presentation.sidebar"),
            example: { left: { widgets: ["related"] }, right: { widgets: ["toc"] } },
            required: true,
            additionalProperties: true
          })
        } : {}),
        breadcrumbs: array(breadcrumbItem, { default: literal([]), example: [{ name: "思考", path: "blog/categories/thinking" }], required: true })
      }, { required: true, example: { pageType: "content", articleStyle: "tech", indent: false, blogPath: "blog", brand: {}, breadcrumbs: [] } }),
      seo: object({
        title: field("string", { default: computed("由文章标题与站点标题组合"), example: "Hello Stellar - Stellar", required: true }),
        description: field("string", { default: derived("page.description", "item.excerpt", "item.content"), example: "文章摘要", required: true }),
        keywords: array(stringItem, { default: derived("page.keywords", "item.tags", "site.keywords"), example: ["Hexo", "Stellar"], required: true }),
        robots: field(["string", "null"], { default: derived("IS_BACKUP", "page.robots"), example: "noindex, nofollow", required: true }),
        canonical: field(["string", "null"], { default: derived("hexo.stellar.config.seo.canonical.host", "item.route.path"), example: "https://example.com/blog/hello/", required: true }),
        openGraph,
        jsonLd: field("object", { default: computed("由 BlogPosting 结构化数据规则生成"), example: { "@type": "BlogPosting" }, required: true, additionalProperties: true })
      }, { required: true, example: { title: "Hello Stellar - Stellar", description: "文章摘要", keywords: ["Hexo"], robots: null, canonical: null, openGraph: null, jsonLd: { "@type": "BlogPosting" } } }),
      article: object({
        heti: field("boolean", { default: derived("hexo.stellar.config.extensions.features.heti.enabled"), example: false, required: true }),
        ...(profile === "topic" ? {
          banner: field("object", {
            default: inherited("item.presentation.banner"),
            example: { image: "/topic.webp", headline: "Topic" },
            required: true,
            additionalProperties: true
          })
        } : {}),
        tags: array(tagLink, { default: computed("由 Hexo 标签关系规范化；content.article.footer.showTags 禁用时为空"), example: [{ name: "Hexo", path: "tags/hexo" }], required: true }),
        footer: object({
          references: array(field("any", { additionalProperties: true }), { default: inherited("item.presentation.footer.references"), example: [], required: true }),
          license: field("string", { default: computed("由最终许可协议与作者信息生成"), example: "CC BY 4.0", required: true }),
          share,
          contributor
        }, { required: true, example: { references: [], license: "", share: null, contributor: null } }),
        previous: postLink,
        next: postLink,
        related: object({
          enabled: field("boolean", { default: derived("hexo.stellar.config.content.article.relatedPostsLimit > 0"), example: false, required: true }),
          title: field("string", { default: literal(""), example: "Related Posts", required: true }),
          maxCount: field("number", { default: literal(5), example: 5, required: true }),
          items: array(relatedItem, { default: literal([]), example: [], required: true })
        }, { required: true, example: { enabled: false, title: "", maxCount: 5, items: [] } }),
        comments: object({
          enabled: field("boolean", { default: computed("由最终 comments.enabled 与 service 生成"), example: true, required: true }),
          title: field(["string", "null"], { default: inherited("item.presentation.comments.title"), example: "参与讨论", required: true }),
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
        categoryStyle: field("string", { default: derived("hexo.stellar.config.content.article.categoryColors"), example: "--text-p2:#f44336;--theme-block:#f4433620", required: true }),
        tags: array(stringItem, { default: computed("content.article.listing.showTags 启用时最多五项"), example: ["Hexo"], required: true }),
        authorId: field("string", { default: derived("item.presentation.article.author", "stellar.data.defaultAuthor.id"), example: "xaoxuu", required: true }),
        priority: field("number", { default: inherited("item.listing.priority"), example: 1, required: true }),
        listed: field("boolean", { default: inherited("item.visibility.listed"), example: true, required: true }),
        cardStyle: field("string", { default: inherited("collection.listing.cardStyle"), example: "hero", required: true })
      }, { required: true, example: { href: "blog/hello", title: "Hello Stellar", layout: "post", date: null, cover: "", caption: "", excerpt: "", categories: [], categoryStyle: "", tags: [], authorId: "", priority: 0, listed: true, cardStyle: "classic" } })
    }, {
      default: computed(`由 ${profile === "topic" ? "Topic" : "Post"} PageViewModel 构建器生成`),
      example: { document: { language: "zh-CN", headEndInject: "", bodyEndInject: "" }, layout: { pageType: "content" }, seo: { title: "Hello Stellar - Stellar" } },
      required: true
    });
  }

  if (profile === "wiki") {
    const stringItem = field("string", { default: computed("由构建期数组逐项归一化"), example: "Stellar" });
    const renderBrand = brandSchema(factory);
    renderBrand.required = true;
    const wikiLink = field(["object", "null"], {
      default: computed("由 Wiki navigation.tree 当前页码计算；不存在时为 null"),
      example: { title: "安装", path: "wiki/stellar/install", date: null },
      required: true,
      properties: {
        title: field("string", { default: literal(""), example: "安装", required: true }),
        path: field("string", { default: literal(""), example: "wiki/stellar/install", required: true }),
        date: field(["string", "null"], { default: literal(null), example: null, required: true })
      }
    });
    const share = field(["object", "null"], {
      default: computed("由最终 footer.share 生成；禁用时为 null"),
      example: { services: ["link"], permalink: "https://example.com/wiki/stellar/", title: "Stellar - Example" },
      required: true,
      properties: {
        services: array(stringItem, { default: literal([]), example: ["wechat", "link"], required: true }),
        permalink: field("string", { default: inherited("item.route.permalink"), example: "https://example.com/wiki/stellar/", required: true }),
        title: field("string", { default: computed("由页面标题与站点标题组合"), example: "Stellar - Example", required: true }),
        image: field("string", { default: inherited("item.presentation.card.cover"), example: "/cover.webp", required: true }),
        summary: field("string", { default: computed("由 description/excerpt/content 截断"), example: "Wiki 摘要", required: true })
      }
    });
    const contributor = field(["object", "null"], {
      default: computed("由 contributors 选中 provider 的 repositories 最长 source_prefix 匹配与源文件生成"),
      example: { editUrl: "https://github.com/example/repo/blob/main/index.md", commitsUrl: "https://api.github.com/repos/example/repo/commits?path=index.md" },
      required: true,
      properties: {
        editUrl: field("string", { default: literal(""), example: "https://github.com/example/repo/blob/main/index.md", required: true }),
        commitsUrl: field("string", { default: literal(""), example: "https://api.github.com/repos/example/repo/commits?path=index.md", required: true })
      }
    });
    const comments = object({
      enabled: field("boolean", { default: computed("由最终 comments.enabled 与 service 生成"), example: true, required: true }),
      title: field(["string", "null"], { default: inherited("item.presentation.comments.title"), example: "参与讨论", required: true }),
      id: field("string", { default: inherited("item.presentation.comments.id"), example: "wiki-stellar", required: true }),
      service: field("string", { default: inherited("item.presentation.comments.provider"), example: "giscus", required: true }),
      options: field("object", { default: computed("由激活服务参数袋生成"), example: { "data-repo": "example/repo" }, required: true, additionalProperties: true }),
      pageTitle: field("string", { default: inherited("item.title"), example: "开始", required: true })
    }, { required: true, example: { enabled: true, title: "参与讨论", id: "", service: "giscus", options: {}, pageTitle: "开始" } });
    const relatedItem = object({
      href: field("string", { default: literal(""), example: "wiki/example", required: true }),
      title: field("string", { default: literal(""), example: "Example", required: true }),
      description: field("string", { default: literal(""), example: "Related Wiki", required: true })
    }, { example: { href: "wiki/example", title: "Example", description: "Related Wiki" } });
    const relatedGroup = object({
      name: field("string", { default: literal(""), example: "博客主题", required: true }),
      items: array(relatedItem, { default: literal([]), example: [], required: true })
    }, { example: { name: "博客主题", items: [] } });
    const breadcrumb = object({
      name: field("string", { default: inherited("collection.identity.name"), example: "Stellar", required: true }),
      path: field("string", { default: inherited("collection.route.homepage"), example: "wiki/stellar", required: true })
    }, { example: { name: "Stellar", path: "wiki/stellar" } });
    const openGraph = field(["object", "null"], {
      default: computed("由 SEO 配置与页面 Open Graph 覆盖生成；禁用时为 null"),
      example: { args: { image: "/cover.webp" }, title: "开始", siteName: "Example", twitterTitle: "开始", publishedTime: null, modifiedTime: null, tags: [] },
      required: true,
      additionalProperties: true
    });

    properties.render = object({
      document: object({
        language: field("string", { default: derived("page.lang", "page.language", "site.language"), example: "zh-CN", required: true }),
        headEndInject: field("string", { default: literal(""), example: "", required: true }),
        bodyEndInject: field("string", { default: literal(""), example: "", required: true }),
        preferredTheme: field("string", { default: derived("hexo.stellar.config.appearance.colorScheme"), example: "auto", required: true })
      }, { required: true, example: { language: "zh-CN", headEndInject: "", bodyEndInject: "", preferredTheme: "auto" } }),
      layout: object({
        pageType: field("string", { default: literal("content"), example: "content", required: true }),
        articleStyle: field(["string", "null"], { default: inherited("item.presentation.article.style"), example: "tech", required: true }),
        indent: field("boolean", { default: computed("由 article.paragraphIndent 与 style 解析"), example: false, required: true }),
        siteBackground: field("boolean", { default: derived("hexo.stellar.config.appearance.backgrounds.page.image"), example: false, required: true }),
        leftbarSurface: field("string", { default: derived("hexo.stellar.config.appearance.backgrounds.sidebar.surface"), example: "glass", required: true }),
        leftbarBlur: field("boolean", { default: literal(false), example: false, required: true }),
        brand: renderBrand,
        wikiIndexPath: field("string", { default: derived("layout.profiles.wiki_index.path"), example: "wiki", required: true }),
        showWikiHome: field("boolean", { default: inherited("item.presentation.sidebar.left.wikiHome"), example: true, required: true }),
        searchFilter: field("string", { default: computed("由页面路径保留 Wiki 搜索的既有两段目录范围"), example: "wiki/stellar/", required: true }),
        sidebar: field("object", { default: inherited("item.presentation.sidebar"), example: { left: { widgets: ["tree"] }, right: { widgets: ["toc"] } }, required: true, additionalProperties: true }),
        breadcrumbs: array(breadcrumb, { default: literal([]), example: [{ name: "Stellar", path: "wiki/stellar" }], required: true })
      }, { required: true, example: { pageType: "content", articleStyle: "tech", indent: false, brand: {}, wikiIndexPath: "wiki", showWikiHome: true, searchFilter: "wiki/stellar/", sidebar: {}, breadcrumbs: [] } }),
      seo: object({
        title: field("string", { default: computed("由 Wiki 名、页面标题和站点标题组合"), example: "Stellar：开始 - Example", required: true }),
        description: field("string", { default: derived("page.description", "collection.identity.description", "item.excerpt", "item.content"), example: "Wiki 摘要", required: true }),
        keywords: array(stringItem, { default: derived("page.keywords", "item.tags", "site.keywords"), example: ["Stellar"], required: true }),
        robots: field(["string", "null"], { default: derived("IS_BACKUP", "page.robots"), example: null, required: true }),
        canonical: field(["string", "null"], { default: derived("seo.canonical.host", "item.route.path"), example: "https://example.com/wiki/stellar/", required: true }),
        openGraph,
        jsonLd: field("object", { default: computed("由 WebPage 结构化数据规则生成"), example: { "@type": "WebPage" }, required: true, additionalProperties: true })
      }, { required: true, example: { title: "Stellar：开始 - Example", description: "Wiki 摘要", keywords: ["Stellar"], robots: null, canonical: null, openGraph: null, jsonLd: { "@type": "WebPage" } } }),
      cover: object({
        enabled: field("boolean", { default: computed("仅 Wiki 首页且 hero.enabled 时启用"), example: true, required: true }),
        background: field("object", { default: inherited("collection.presentation.hero.background"), example: { effect: { type: "galaxy" } }, required: true, additionalProperties: true }),
        preview: field("object", { default: inherited("collection.presentation.hero.preview"), example: { type: "terminal" }, required: true, additionalProperties: true }),
        actions: array(field("object", { additionalProperties: true }), { default: literal([]), example: [], required: true }),
        title: field("string", { default: inherited("collection.identity.headline"), example: "每个人的独立博客", required: true }),
        description: field("string", { default: inherited("collection.identity.description"), example: "Stellar 文档", required: true }),
        repository: field("string", { default: inherited("collection.source.repository"), example: "xaoxuu/hexo-theme-stellar", required: true }),
        sourceUrl: field("string", { default: computed("由 repository 生成"), example: "https://github.com/xaoxuu/hexo-theme-stellar", required: true }),
        releaseApi: field("string", { default: computed("由 GitHub service API 与 repository 生成"), example: "https://api.github.com/repos/xaoxuu/hexo-theme-stellar/tags", required: true }),
        projectName: field("string", { default: inherited("collection.identity.name"), example: "Stellar", required: true }),
        siteName: field("string", { default: derived("site.title"), example: "Example", required: true })
      }, { required: true, example: { enabled: true, background: {}, preview: {}, actions: [], title: "Stellar", description: "", repository: "", sourceUrl: "", releaseApi: "", projectName: "Stellar", siteName: "Example" } }),
      article: object({
        heti: field("boolean", { default: derived("extensions.features.heti.enabled"), example: false, required: true }),
        banner: field("object", { default: inherited("item.presentation.banner"), example: { headline: "开始" }, required: true, additionalProperties: true }),
        updated: field(["string", "null"], { default: inherited("item.updated"), example: "2026-08-23T00:00:00.000Z", required: true }),
        readmeHtml: field("string", { default: computed("Wiki 首页正文为空且配置 repository 时生成远程 README 占位"), example: "", required: true }),
        footer: object({
          references: array(field("any", { additionalProperties: true }), { default: inherited("item.presentation.footer.references"), example: [], required: true }),
          license: field("string", { default: computed("由最终许可协议与作者信息生成"), example: "CC BY-NC-SA 4.0", required: true }),
          share,
          contributor
        }, { required: true, example: { references: [], license: "", share: null, contributor: null } }),
        previous: wikiLink,
        next: wikiLink,
        comments,
        related: array(relatedGroup, { default: literal([]), example: [], required: true })
      }, { required: true, example: { heti: false, banner: {}, updated: null, readmeHtml: "", footer: {}, previous: null, next: null, comments: {}, related: [] } }),
      listing: object({
        id: field("string", { default: inherited("collection.id"), example: "stellar", required: true }),
        href: field("string", { default: inherited("collection.route.homepage"), example: "wiki/stellar", required: true }),
        name: field("string", { default: inherited("collection.identity.name"), example: "Stellar", required: true }),
        headline: field("string", { default: inherited("collection.identity.headline"), example: "每个人的独立博客", required: true }),
        caption: field("string", { default: computed("由 collection tagline/description 生成"), example: "基于 Hexo 的全能型主题", required: true }),
        description: field("string", { default: inherited("collection.identity.description"), example: "Stellar 文档", required: true }),
        tags: array(stringItem, { default: derived("collection.tags"), example: ["博客主题"], required: true }),
        audience: field("string", { default: inherited("collection.identity.audience"), example: "独立博主", required: true }),
        icon: field("string", { default: inherited("collection.identity.icon"), example: "/stellar.svg", required: true }),
        cover: field("string", { default: inherited("collection.presentation.card.cover"), example: "/cover.webp", required: true }),
        repository: field("string", { default: inherited("collection.source.repository"), example: "xaoxuu/hexo-theme-stellar", required: true }),
        repositoryApi: field("string", { default: computed("由 GitHub service API 与 repository 生成"), example: "https://api.github.com/repos/xaoxuu/hexo-theme-stellar", required: true }),
        priority: field("number", { default: inherited("collection.listing.priority"), example: 1, required: true }),
        order: field("number", { default: inherited("collection.listing.order"), example: 0, required: true }),
        listed: field("boolean", { default: inherited("collection.visibility.listed"), example: true, required: true })
      }, { required: true, example: { id: "stellar", href: "wiki/stellar", name: "Stellar", headline: "Stellar", caption: "", description: "", tags: [], audience: "", icon: "", cover: "", repository: "", repositoryApi: "", priority: 0, order: 0, listed: true } })
    }, {
      default: computed("由 Wiki PageViewModel 构建器生成"),
      example: { document: { language: "zh-CN" }, layout: { pageType: "content" }, seo: { title: "Stellar - Example" } },
      required: true
    });
  }

  if (profile === "notebook") {
    const stringItem = field("string", { default: computed("由构建期数组逐项归一化"), example: "tools" });
    const renderBrand = brandSchema(factory);
    renderBrand.required = true;
    const breadcrumb = object({
      name: field("string", { default: inherited("collection.identity.headline"), example: "Development Notes", required: true }),
      path: field("string", { default: inherited("collection.route.baseDir"), example: "notes/dev", required: true })
    }, { example: { name: "Development Notes", path: "notes/dev" } });
    const tagLink = object({
      name: field("string", { default: literal(""), example: "tools/cli", required: true }),
      path: field("string", { default: computed("由 Notebook 标签导航映射"), example: "notes/dev/tags/tools/cli", required: true })
    }, { example: { name: "tools/cli", path: "notes/dev/tags/tools/cli" } });
    const tagTreeItem = object({
      id: field("string", { default: literal(""), example: "tools/cli", required: true }),
      name: field("string", { default: literal(""), example: "tools/cli", required: true }),
      label: field("string", { default: literal(""), example: "cli", required: true }),
      path: field("string", { default: inherited("collection.navigation.tags.path"), example: "notes/dev/tags/tools/cli", required: true }),
      parentId: field(["string", "null"], { default: literal(null), example: "tools", required: true }),
      children: array(stringItem, { default: literal([]), example: [], required: true })
    }, { example: { id: "tools/cli", name: "tools/cli", label: "cli", path: "notes/dev/tags/tools/cli", parentId: "tools", children: [] } });
    const comments = object({
      enabled: field("boolean", { default: computed("由最终 comments.enabled 与 service 生成"), example: true, required: true }),
      title: field(["string", "null"], { default: inherited("item.presentation.comments.title"), example: "参与讨论", required: true }),
      id: field("string", { default: inherited("item.presentation.comments.id"), example: "note-node", required: true }),
      service: field("string", { default: inherited("item.presentation.comments.provider"), example: "giscus", required: true }),
      options: field("object", { default: computed("由激活服务参数袋生成"), example: {}, required: true, additionalProperties: true }),
      pageTitle: field("string", { default: inherited("item.title"), example: "Node.js", required: true })
    }, { required: true, example: { enabled: true, title: "参与讨论", id: "", service: "giscus", options: {}, pageTitle: "Node.js" } });
    const share = field(["object", "null"], {
      default: computed("由 Notebook Footer 分享配置生成；禁用时为 null"),
      example: null,
      required: true,
      additionalProperties: true
    });

    properties.render = object({
      document: object({
        language: field("string", { default: derived("page.lang", "page.language", "site.language"), example: "zh-CN", required: true }),
        headEndInject: field("string", { default: literal(""), example: "", required: true }),
        bodyEndInject: field("string", { default: literal(""), example: "", required: true }),
        preferredTheme: field("string", { default: derived("appearance.colorScheme"), example: "auto", required: true })
      }, { required: true, example: { language: "zh-CN", headEndInject: "", bodyEndInject: "", preferredTheme: "auto" } }),
      layout: object({
        pageType: field("string", { default: literal("content"), example: "content", required: true }),
        articleStyle: field(["string", "null"], { default: inherited("item.presentation.article.style"), example: "tech", required: true }),
        indent: field("boolean", { default: computed("由 article.paragraphIndent 与 style 解析"), example: false, required: true }),
        siteBackground: field("boolean", { default: derived("appearance.backgrounds.page.image"), example: false, required: true }),
        leftbarSurface: field("string", { default: derived("appearance.backgrounds.sidebar.surface"), example: "glass", required: true }),
        leftbarBlur: field("boolean", { default: literal(false), example: false, required: true }),
        brand: renderBrand,
        notebookIndexPath: field("string", { default: derived("layout.profiles.notebook_index.path"), example: "notebooks", required: true }),
        notebookPath: field("string", { default: inherited("collection.route.baseDir"), example: "notes/dev", required: true }),
        searchFilter: field("string", { default: inherited("collection.route.baseDir"), example: "notes/dev", required: true }),
        sidebar: field("object", { default: inherited("item.presentation.sidebar"), example: {}, required: true, additionalProperties: true }),
        breadcrumbs: array(breadcrumb, { default: literal([]), example: [], required: true }),
        tagTree: array(tagTreeItem, { default: literal([]), example: [], required: true }),
        recentItems: array(field("object", { additionalProperties: true }), { default: literal([]), example: [], required: true })
      }, { required: true, example: { pageType: "content", articleStyle: "tech", indent: false, brand: {}, notebookIndexPath: "notebooks", notebookPath: "notes/dev", searchFilter: "notes/dev", sidebar: {}, breadcrumbs: [], tagTree: [] } }),
      seo: object({
        title: field("string", { default: computed("由 Note 标题与站点标题组合"), example: "Node.js - Example", required: true }),
        description: field("string", { default: derived("page.description", "item.excerpt", "item.content"), example: "Note 摘要", required: true }),
        keywords: array(stringItem, { default: derived("page.keywords", "item.tags", "site.keywords"), example: ["Node.js"], required: true }),
        robots: field(["string", "null"], { default: derived("IS_BACKUP", "page.robots"), example: null, required: true }),
        canonical: field(["string", "null"], { default: derived("seo.canonical.host", "item.route.path"), example: "https://example.com/notes/dev/node/", required: true }),
        openGraph: field(["object", "null"], { default: computed("由 SEO 与页面 Open Graph 配置生成"), example: null, required: true, additionalProperties: true }),
        jsonLd: field("object", { default: computed("由 WebPage 结构化数据规则生成"), example: { "@type": "WebPage" }, required: true, additionalProperties: true })
      }, { required: true, example: { title: "Node.js - Example", description: "Note 摘要", keywords: [], robots: null, canonical: null, openGraph: null, jsonLd: { "@type": "WebPage" } } }),
      article: object({
        heti: field("boolean", { default: derived("extensions.features.heti.enabled"), example: false, required: true }),
        banner: field("object", { default: inherited("item.presentation.banner"), example: {}, required: true, additionalProperties: true }),
        created: field(["string", "null"], { default: inherited("item.date"), example: "2026-08-23T00:00:00.000Z", required: true }),
        updated: field(["string", "null"], { default: inherited("item.updated"), example: "2026-08-23T00:00:00.000Z", required: true }),
        tags: array(tagLink, { default: literal([]), example: [], required: true }),
        footer: object({
          references: array(field("any", { additionalProperties: true }), { default: inherited("item.presentation.footer.references"), example: [], required: true }),
          license: field("string", { default: computed("由最终许可协议与作者信息生成"), example: "CC BY 4.0", required: true }),
          share,
          contributor: field(["object", "null"], { default: computed("由 contributors 选中 provider 的 repositories 最长 source_prefix 匹配与源文件生成"), example: null, required: true, additionalProperties: true })
        }, { required: true, example: { references: [], license: "", share: null, contributor: null } }),
        comments
      }, { required: true, example: { heti: false, banner: {}, created: null, updated: null, tags: [], footer: {}, comments: {} } }),
      listing: object({
        id: field("string", { default: inherited("item.id"), example: "note-node", required: true }),
        collectionId: field("string", { default: inherited("collection.id"), example: "dev", required: true }),
        collectionName: field("string", { default: inherited("collection.identity.name"), example: "Development Notes", required: true }),
        href: field("string", { default: derived("page.link", "item.route.path"), example: "notes/dev/node", required: true }),
        title: field("string", { default: inherited("item.title"), example: "Node.js", required: true }),
        cover: field("string", { default: inherited("item.presentation.card.cover"), example: "", required: true }),
        excerpt: field("string", { default: computed("由 excerpt/description/content 与 Notebook 摘要长度生成"), example: "Note 摘要", required: true }),
        tags: array(stringItem, { default: inherited("item.tags"), example: ["tools"], required: true }),
        date: field(["string", "null"], { default: inherited("item.date"), example: null, required: true }),
        updated: field(["string", "null"], { default: inherited("item.updated"), example: null, required: true }),
        priority: field("number", { default: inherited("item.listing.priority"), example: 0, required: true }),
        listed: field("boolean", { default: inherited("item.visibility.listed"), example: true, required: true })
      }, { required: true, example: { id: "note-node", collectionId: "dev", collectionName: "Development Notes", href: "notes/dev/node", title: "Node.js", cover: "", excerpt: "", tags: [], date: null, updated: null, priority: 0, listed: true } })
    }, {
      default: computed("由 Notebook PageViewModel 构建器生成"),
      example: { document: { language: "zh-CN" }, layout: { pageType: "content" }, seo: { title: "Node.js - Example" } },
      required: true
    });
  }

  return object(properties, {
    required: true,
    example: profile === "post" || profile === "wiki" || profile === "notebook"
      ? { collection: { id: profile, profile }, item: { id: `${profile}-hello` }, render: { document: {}, layout: {}, seo: {} } }
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
