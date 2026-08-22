/**
 * notebooks.js v2
 *
 * 笔记本系统构建（纯函数部分，供 events/lib/notebooks.js 调用与单测覆盖）。
 * 把「每个笔记本全量 filter 一遍全部页面」改为单遍分组（O(NB+P) 替代 O(NB*P)），
 * 标签树与 noteMap 构建逻辑和元素顺序不变。
 */

'use strict';

const { normalize_path } = require('./path_utils');
const { getCollectionId } = require('./content-config');
const { profilePath, requireLayoutProfiles } = require("./layout-config");

class NotePage {
  constructor(page) {
    this.id = page._id;
    this.collectionId = getCollectionId(page, 'notebook');
    this.title = page.title;
    this.tags = page.tags;
    this.path = page.path;
    this.path_key = normalize_path(page.path);
    this.layout = page.layout;
    this.date = page.date;
    this.updated = page.updated || page.date;

    this.priority = page.listing?.priority || 0;
  }
}

function splitTag(tag) {
  return tag.split('/').filter(t => t.length > 0);
}

/**
 * 单遍按 notebook id 分组页面。
 * 页面按 collection.type/id 归属笔记本。
 * @param {Array} pages 页面数组（warehouse Query 的 .data）
 * @returns {Map<string, Array>}
 */
function groupPagesByNotebook(pages) {
  const pagesByNotebook = new Map();
  for (const page of pages) {
    const notebookId = getCollectionId(page, 'notebook');
    if (notebookId == null) {
      continue;
    }
    let arr = pagesByNotebook.get(notebookId);
    if (arr == null) {
      arr = [];
      pagesByNotebook.set(notebookId, arr);
    }
    arr.push(page);
  }
  return pagesByNotebook;
}

function prepareNotebook(id, info, ctx, pages) {
  const notebook = info;
  const profiles = requireLayoutProfiles(ctx.stellar?.config);
  const notebookDefaults = ctx.stellar.config.content.notebook;
  notebook.id = id;

  notebook.routing ||= {};
  notebook.listing ||= {};
  notebook.navigation ||= {};
  notebook.footer ||= {};
  notebook.sidebar ||= {};
  notebook.note ||= {};
  notebook.note.sidebar ||= {};

  if (notebook.routing.base_dir) {
    if (notebook.routing.base_dir.startsWith('/')) {
      notebook.routing.base_dir = notebook.routing.base_dir.substring(1);
    }
    if (notebook.routing.base_dir.length > 1 && !notebook.routing.base_dir.endsWith('/')) {
      notebook.routing.base_dir = notebook.routing.base_dir + '/';
    }
  } else {
    const notebooksBaseDir = profilePath(profiles.notebookIndex.path);
    notebook.routing.base_dir = notebooksBaseDir ? `${notebooksBaseDir}/${id}` : id;
  }

  notebook.listing.sort ||= 0;
  notebook.listing.excerpt_length ||= notebookDefaults.listing.excerptLength;
  notebook.listing.per_page ??= notebookDefaults.listing.perPage ?? ctx.config.per_page ?? 10;
  notebook.listing.order_by ||= notebookDefaults.listing.orderBy;
  notebook.footer.license ??= notebookDefaults.footer.license;
  notebook.footer.share ??= notebookDefaults.footer.share;

  notebook.sidebar.left ??= { widgets: profiles.noteIndex.sidebar.left.widgets };
  notebook.sidebar.right ??= { widgets: profiles.noteIndex.sidebar.right.widgets };
  notebook.note.sidebar.left ??= { widgets: profiles.note.sidebar.left.widgets };
  notebook.note.sidebar.right ??= { widgets: profiles.note.sidebar.right.widgets };

  const tagMap = new Map(); // tagId: tagInfo
  notebook.tagTree = tagMap;

  const rootTag = {
    id: '',
    name: '',
    part: '',
    path: notebook.routing.base_dir,
    parent: null, // parent tag id
    childSet: new Set(), // child tag ids
    noteSet: new Set(), // note ids
  };
  tagMap.set(rootTag.id, rootTag);

  // Iterate through all notes in the notebook, build the tag tree.
  for (const page of pages) {
    rootTag.noteSet.add(page._id);

    if (!page.tags) {
      continue;
    }

    for (const hierarchyTag of page.tags) {
      const parts = splitTag(hierarchyTag);
      let parent = rootTag;
      for (const part of parts) {
        const tagName = parent.name ? `${parent.name}/${part}` : part;
        const tagId = tagName.toLowerCase();
        let tag = tagMap.get(tagId);
        if (tag == null) {
          tag = {
            id: tagId,
            name: tagName,
            part: part,
            path: `${notebook.routing.base_dir}/tags/${tagId}`,
            parent: parent.id,
            childSet: new Set(),
            noteSet: new Set(),
          };
          tagMap.set(tagId, tag);
          parent.childSet.add(tagId);
        }

        tag.noteSet.add(page._id);
        parent = tag;
      }
    }
  }

  notebook.noteMap = pages.map(p => new NotePage(p)).reduce((map, note) => {
    map.set(note.id, note);
    return map;
  }, new Map());

  // Sort child tags for each tag.
  for (const [_, tag] of tagMap) {
    tag.children = Array.from(tag.childSet);
    tag.children.sort();
  }

  return notebook;
}

function getNotebooksObject(ctx) {
  const notebooks = {
    tree: {},
  };

  const data = ctx.locals.get('data');
  const pagesByNotebook = groupPagesByNotebook(ctx.locals.get('pages').data);
  const list = [];
  for (const [key, info] of Object.entries(data)) {
    if (!key.startsWith('notebooks/') || key.endsWith('.DS_Store')) {
      continue;
    }
    const id = key.substring(10);
    list.push(prepareNotebook(id, info, ctx, pagesByNotebook.get(id) || []));
  }
  list.sort((a, b) => a.listing.sort - b.listing.sort);
  for (const info of list) {
    notebooks.tree[info.id] = info;
  }

  return notebooks;
}

module.exports = {
  groupPagesByNotebook,
  NotePage,
  getNotebooksObject
};
