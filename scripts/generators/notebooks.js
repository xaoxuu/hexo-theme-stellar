/* global hexo */
/**
 * notebooks v1
 */

"use strict";

const { generatorPath, requireLayoutProfiles, toRenderNavigation } = require("../lib/layout-config");

hexo.extend.generator.register('notebooks', function (locals) {
  const { notebooks } = hexo.theme.config;
  const profiles = requireLayoutProfiles(hexo.stellar?.config);
  const profile = profiles.notebookIndex;
  if (!notebooks?.tree || Object.keys(notebooks.tree).length === 0) {
    return []
  }
  // 不用 blog 和 notebooks 时不必依赖 hexo-pagination
  const pagination = require('hexo-pagination')

  function paginationWithEmpty(base, posts, options={}) {
    const { layout, data = {} } = options
    if (posts.length === 0) {
      base = `${base}/`
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
          prev_link: '',
          next: 0,
          next_link: '',
        }
      }]
    } else {
      return pagination(base, posts, options)
    }
  }

  const routes = []

  // The index page of all notebooks.
  routes.push({
    path: generatorPath(profile.path),
    layout: ['notebooks'],
    data: {
      layout: 'notebooks',
      navigation: toRenderNavigation(profile),
    }
  })

  for (const notebook of Object.values(notebooks.tree)) {
    const pages = locals.pages.filter(p => {
      const note = notebook.noteMap.get(p._id);
      return note != null && note.listed !== false;
    }).sort(notebook.listing.order_by);
    pages.data.sort((a, b) => notebook.noteMap.get(b._id).priority - notebook.noteMap.get(a._id).priority)

    // Note list pages (for every tag) of current notebook.
    for (const [_, tag] of notebook.tagTree) {
      const notes = pages.filter(p => tag.noteSet.has(p._id))
      const slices = paginationWithEmpty(tag.path, notes, {
        perPage: notebook.listing.per_page,
        layout: ['notes'],
        data: {
          layout: 'notes',
          navigation: { menu: notebook.navigation.menu ?? profiles.noteIndex.navigation.activeMenu },
          stellarConfig: { collection: { profile: "notebook", id: notebook.id } },
          activeTag: tag.id,
        }
      })
      routes.push(...slices)
    }
  }

  return routes
})
