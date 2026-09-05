/* global hexo */
/**
 * notebooks v2 explicit listing projection
 */

"use strict";

const { generatorPath, requireLayoutProfiles, toRenderNavigation } = require("../lib/layout-config");
const { deepFreeze } = require("../schema/schema-utils");
const { selectListingItems, stableSort } = require("../lib/collection-pipeline/shared");

hexo.extend.generator.register("notebooks", function (locals) {
  const { notebookIndex } = hexo.stellar.data;
  const profiles = requireLayoutProfiles(hexo.stellar?.config);
  const profile = profiles.notebookIndex;
  if (!notebookIndex?.items || notebookIndex.items.length === 0) {
    return [];
  }
  // 不用 blog 和 notebooks 时不必依赖 hexo-pagination
  const pagination = require("hexo-pagination");

  function paginationWithEmpty(base, posts, options = {}) {
    const { layout, data = {} } = options;
    if (posts.length === 0) {
      base = `${base}/`;
      return [{
        path: base,
        layout: layout,
        data: {
          ...data,
          base: base,
          total: 1,
          current: 1,
          current_url: base,
          posts: posts,
          prev: 0,
          prev_link: "",
          next: 0,
          next_link: "",
        }
      }];
    } else {
      return pagination(base, posts, options);
    }
  }

  const routes = [];
  const collections = notebookIndex.items
    .filter(item => item.listed !== false)
    .slice();
  const orderedCollections = stableSort(collections, (left, right) => left.order - right.order);

  // The index page of all notebooks.
  routes.push({
    path: generatorPath(profile.path),
    layout: ["notebooks"],
    data: {
      layout: "notebooks",
      navigation: toRenderNavigation(profile),
      notebookIndex: deepFreeze({
        mode: "collections",
        items: orderedCollections,
        recentItems: notebookIndex.recentItems
      })
    }
  });

  for (const notebook of notebookIndex.items) {
    // Note list pages (for every tag) of current notebook.
    for (const tag of notebook.tags) {
      const notes = selectListingItems(notebook.items, {
        tagId: tag.id,
        tags: notebook.tags
      });
      const slices = paginationWithEmpty(tag.path, notes, {
        perPage: notebook.perPage,
        layout: ["notes"],
        data: {
          layout: "notes",
          navigation: { menu: notebook.navigation.menu ?? profiles.noteIndex.activeMenu }
        }
      });
      for (const slice of slices) {
        const items = deepFreeze(slice.data.posts.slice());
        slice.data.notebookIndex = deepFreeze({
          mode: "notes",
          collection: notebook,
          tags: notebook.tags,
          activeTag: tag.id,
          items
        });
        slice.data.activeTag = tag.id;
      }
      routes.push(...slices);
    }
  }

  return routes;
});
