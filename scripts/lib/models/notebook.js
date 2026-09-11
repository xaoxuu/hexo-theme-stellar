"use strict";

const { stripHTML, truncate } = require("hexo-util");
const { CONTENT_MODEL_FIELDS, ContentConfigError, isPlainObject } = require("../content-config");
const { profilePath, requireLayoutProfiles, toRenderNavigation, toRenderRegions } = require("../layout-config");
const { normalizeThemeComments } = require("../comments");
const { articlePresentationDefaults, collectionFooterDefaults, requireContentConfig } = require("../content-defaults");
const { cloneValue, deepFreeze, pick, mergeConfig, toContentNavigation, collectionBrand, assertCollectionBrandConfig, assertNormalizedConfig, layoutConfigRequirement, normalizeTerms, normalizeCollectionPath, buildPostRenderModel, buildContentItemModel, normalizeCollectionIdentity } = require("./shared");

function notebookBaseDir(collectionId, collectionConfig, stellarConfig) {
  if (typeof collectionConfig.route?.path === "string" && collectionConfig.route.path.length > 0) {
    return normalizeCollectionPath(collectionConfig.route.path);
  }
  const root = profilePath(requireLayoutProfiles(stellarConfig).notebooks.path);
  return normalizeCollectionPath([root, collectionId].filter(Boolean).join("/"));
}

function buildNotebookTagNavigation(collectionId, baseDir, collectionItems) {
  const tags = new Map();
  const items = Array.isArray(collectionItems) ? collectionItems : [];
  for (const item of items) {
    if (item?.collection?.profile !== "notebook" || item.collection.id !== collectionId) continue;
    for (const hierarchy of normalizeTerms(item.tags)) {
      const parts = hierarchy.split("/").filter(Boolean);
      for (let index = 0; index < parts.length; index += 1) {
        const name = parts.slice(0, index + 1).join("/");
        const id = name.toLowerCase();
        if (tags.has(id)) continue;
        const parentName = parts.slice(0, index).join("/");
        tags.set(id, {
          id,
          name,
          label: parts[index],
          path: normalizeCollectionPath(`${baseDir}/tags/${id}`),
          parentId: parentName.length > 0 ? parentName.toLowerCase() : null
        });
      }
    }
  }
  return Array.from(tags.values()).sort((left, right) => left.id.localeCompare(right.id));
}

function buildNotebookCollectionModel(input, collectionId) {
  const siteConfig = input.siteConfig;
  const collectionConfig = input.collectionConfig;
  const profiles = requireLayoutProfiles(input.stellarConfig);
  const content = requireContentConfig(input.stellarConfig, input.themeSource);
  const notebookDefaults = content.notebook;
  const collectionListing = isPlainObject(collectionConfig.listing) ? collectionConfig.listing : {};
  const defaultListing = notebookDefaults.listing;
  const baseDir = notebookBaseDir(collectionId, collectionConfig, input.stellarConfig);
  const identity = normalizeCollectionIdentity(collectionConfig);
  const profileNavigation = toRenderNavigation(profiles.notebook);
  const collectionNavigation = toContentNavigation(collectionConfig);
  const collectionRegions = pick(collectionConfig, CONTENT_MODEL_FIELDS.regionIds);
  const defaultBrand = collectionBrand(identity, baseDir, {
    indexPath: profiles.notebooks.path,
    backLabel: "btn.all_notebook"
  });
  assertCollectionBrandConfig(collectionConfig, "collection", input.collectionSource || "<collection>");
  const regions = toRenderRegions(input.stellarConfig, profiles.note, {
    leftbar: { brand: defaultBrand }
  }, {
    brandSources: { collection: defaultBrand },
    layers: [collectionRegions]
  });
  const globalArticle = articlePresentationDefaults(content);
  const globalFooter = collectionFooterDefaults(content);

  return {
    id: collectionId,
    profile: "notebook",
    identity,
    cover: typeof collectionConfig.cover === "string" ? collectionConfig.cover : "",
    source: pick(collectionConfig.source, CONTENT_MODEL_FIELDS.source),
    route: { baseDir },
    navigation: {
      ...mergeConfig(profileNavigation, collectionNavigation),
      tags: buildNotebookTagNavigation(collectionId, baseDir, input.collectionItems)
    },
    listing: {
      priority: collectionListing.priority ?? 0,
      order: collectionListing.order ?? 0,
      excerptLength: collectionListing.excerptLength ?? defaultListing.excerptLength,
      perPage: collectionListing.perPage ?? defaultListing.perPage ?? siteConfig.per_page ?? 10,
      sort: collectionListing.sort ?? defaultListing.sort
    },
    presentation: {
      ...regions,
      article: mergeConfig(globalArticle, pick(collectionConfig.article, CONTENT_MODEL_FIELDS.article)),
      footer: mergeConfig(globalFooter, pick(collectionConfig.footer, CONTENT_MODEL_FIELDS.footer)),
      comments: mergeConfig(
        normalizeThemeComments(input.stellarConfig.comments),
        pick(collectionConfig.comments, CONTENT_MODEL_FIELDS.comments)
      )
    },
    visibility: {
      listed: collectionConfig.visibility?.listed !== false,
      searchable: collectionConfig.visibility?.searchable !== false
    }
  };
}

function buildNotebookTagTree(collection, inputTags) {
  const tags = Array.isArray(inputTags) && inputTags.length > 0
    ? inputTags
    : [{
        id: "",
        name: "",
        label: "",
        path: collection.route.baseDir,
        parentId: null
      }, ...collection.navigation.tags];
  const children = new Map();
  for (const tag of tags) {
    const parentId = typeof tag?.parentId === "string" ? tag.parentId : "";
    if (!children.has(parentId)) children.set(parentId, []);
    if (typeof tag?.id === "string" && tag.id.length > 0) children.get(parentId).push(tag.id);
  }
  return tags.map(tag => ({
    id: typeof tag?.id === "string" ? tag.id : "",
    name: typeof tag?.name === "string" ? tag.name : "",
    label: typeof tag?.label === "string"
      ? tag.label
      : typeof tag?.part === "string" ? tag.part : "",
    path: typeof tag?.path === "string" ? normalizeCollectionPath(tag.path) : collection.route.baseDir,
    parentId: typeof tag?.parentId === "string"
      ? tag.parentId
      : typeof tag?.parent === "string" && tag.parent.length > 0 ? tag.parent : null,
    children: Array.isArray(tag?.children) ? tag.children.slice() : (children.get(tag?.id || "") || []).slice()
  }));
}

function buildNotebookArticleTags(collection, item) {
  const navigation = new Map(collection.navigation.tags.map(tag => [tag.id, tag]));
  return item.tags.map(name => {
    const id = String(name).toLowerCase();
    const tag = navigation.get(id);
    return {
      name: String(name),
      path: tag?.path || normalizeCollectionPath(`${collection.route.baseDir}/tags/${id}`)
    };
  });
}

function buildNotebookRenderModel(input, collection, item) {
  const core = buildPostRenderModel(input, collection, item);
  const explicitDescription = typeof input.frontMatter.description === "string"
    ? input.frontMatter.description
    : "";
  const excerpt = item.excerpt
    ? stripHTML(item.excerpt)
    : explicitDescription || (collection.listing.excerptLength > 0
      ? truncate(stripHTML(item.content), { length: collection.listing.excerptLength })
      : "");
  const collectionTitle = collection.identity.headline || collection.identity.name || collection.id;
  const openGraph = core.seo.openGraph == null ? null : {
    ...core.seo.openGraph,
    args: {
      ...core.seo.openGraph.args,
      type: "website"
    }
  };

  return {
    document: core.document,
    layout: {
      pageType: core.layout.pageType,
      articleStyle: core.layout.articleStyle,
      indent: core.layout.indent,
      siteBackground: core.layout.siteBackground,
      notebookIndexPath: profilePath(requireLayoutProfiles(input.stellarConfig).notebooks.path),
      notebookPath: collection.route.baseDir,
      algoliaFilterPath: collection.route.baseDir,
      topbar: core.layout.topbar,
      leftbar: core.layout.leftbar,
      rightbar: core.layout.rightbar,
      regionWarnings: core.layout.regionWarnings,
      breadcrumbs: [{ name: collectionTitle, path: collection.route.baseDir }],
      tagTree: buildNotebookTagTree(collection, input.tagTree),
      recentItems: cloneValue(Array.isArray(input.recentItems) ? input.recentItems : [])
    },
    seo: {
      ...core.seo,
      openGraph,
      jsonLd: {
        "@context": "https://schema.org",
        "@type": "WebPage",
        "@id": item.route.permalink,
        name: item.title,
        description: core.seo.description,
        url: item.route.permalink,
        isPartOf: {
          "@type": "WebSite",
          name: String(input.siteConfig.title || ""),
          url: String(input.siteConfig.url || "")
        }
      }
    },
    article: {
      heti: core.article.heti,
      banner: cloneValue(item.presentation.banner || {}),
      created: item.date,
      updated: item.updated,
      tags: item.presentation.footer?.showTags === true
        ? buildNotebookArticleTags(collection, item)
        : [],
      footer: {
        ...core.article.footer
      },
      comments: core.article.comments
    },
    listing: {
      id: item.id,
      collectionId: collection.id,
      collectionName: collection.identity.name,
      href: typeof input.page.link === "string" && input.page.link.length > 0
        ? input.page.link
        : item.route.path,
      title: item.title,
      cover: item.cover || "",
      excerpt,
      tags: item.tags.slice(),
      date: item.date,
      updated: item.updated,
      priority: item.listing.priority,
      listed: item.visibility.listed !== false
    }
  };
}

function buildNotebookPageViewModelBase(input) {
  const source = input.source || "<page>";
  const themeSource = input.themeSource || "<theme>";
  const siteConfig = isPlainObject(input.siteConfig) ? input.siteConfig : {};
  const collectionConfig = input.collectionConfig;
  const frontMatter = isPlainObject(input.frontMatter) ? input.frontMatter : {};
  const page = input.page || {};
  const collectionId = input.collectionId;

  assertNormalizedConfig(input.stellarConfig, themeSource, [layoutConfigRequirement()]);

  if (!isPlainObject(collectionConfig)) {
    throw new ContentConfigError([`${source}: 未找到 Notebook collection ${collectionId || "<unknown>"}`]);
  }
  if (frontMatter.collection?.profile !== "notebook") {
    throw new ContentConfigError([`${source}: Note 必须显式声明 collection.profile: notebook`]);
  }
  if (typeof collectionId !== "string" || collectionId.length === 0) {
    throw new ContentConfigError([`${source}: Notebook collection id 必须是非空字符串`]);
  }
  if (frontMatter.collection.id !== collectionId) {
    throw new ContentConfigError([
      `${source}: collection.id ${frontMatter.collection.id} 与 Notebook ${collectionId} 不匹配`
    ]);
  }

  const collection = input.collectionModel || buildNotebookCollectionModel({
    ...input,
    siteConfig,
    collectionConfig
  }, collectionId);
  return deepFreeze({ collection });
}

function completeNotebookPageViewModel(input, base) {
  const source = input.source || "<page>";
  const frontMatter = isPlainObject(input.frontMatter) ? input.frontMatter : {};
  const collection = base.collection;
  const item = buildContentItemModel(input.page || {}, frontMatter, collection, source, {
    source: collection.source,
    visibility: mergeConfig(
      { listed: true, searchable: true },
      input.collectionConfig?.visibility
    )
  });
  const render = buildNotebookRenderModel({
    ...input,
    siteConfig: isPlainObject(input.siteConfig) ? input.siteConfig : {},
    runtimeData: isPlainObject(input.runtimeData) ? input.runtimeData : {},
    frontMatter,
    page: input.page || {}
  }, collection, item);
  return deepFreeze({ collection, item, render });
}

function buildNotebookPageViewModel(input) {
  return completeNotebookPageViewModel(input, buildNotebookPageViewModelBase(input));
}

module.exports = { notebookBaseDir, buildNotebookTagNavigation, buildNotebookCollectionModel, buildNotebookTagTree, buildNotebookArticleTags, buildNotebookRenderModel, buildNotebookPageViewModelBase, completeNotebookPageViewModel, buildNotebookPageViewModel };
