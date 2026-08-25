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
  constructor(page, config) {
    this.id = page._id;
    this.collectionId = getCollectionId(config, "notebook");
    this.title = page.title;
    this.tags = config.tags;
    this.path = page.path;
    this.path_key = normalize_path(page.path);
    this.layout = page.layout;
    this.date = page.date;
    this.updated = page.updated || page.date;

    this.priority = config.listing?.priority || 0;
    this.listed = config.visibility?.listed !== false;
  }
}

function splitTag(tag) {
  return tag.split('/').filter(t => t.length > 0);
}

/**
 * 单遍按 notebook id 分组页面。
 * 页面按 collection.profile/id 归属笔记本。
 * @param {Array} pages 页面数组（warehouse Query 的 .data）
 * @param {Map} pageConfigs 页面对象到冻结 Front Matter 配置的映射
 * @returns {Map<string, Array>}
 */
function groupPagesByNotebook(pages, pageConfigs) {
  const pagesByNotebook = new Map();
  for (const page of pages) {
    const config = pageConfigs.get(page);
    const notebookId = getCollectionId(config, "notebook");
    if (notebookId == null) {
      continue;
    }
    let arr = pagesByNotebook.get(notebookId);
    if (arr == null) {
      arr = [];
      pagesByNotebook.set(notebookId, arr);
    }
    arr.push(new NotePage(page, config));
  }
  return pagesByNotebook;
}

function prepareNotebook(id, info, ctx, pages) {
  const notebook = info;
  const profiles = requireLayoutProfiles(ctx.stellar?.config);
  const notebookDefaults = ctx.stellar.config.content.notebook;
  notebook.id = id;

  notebook.route ||= {};
  notebook.listing ||= {};
  notebook.navigation ||= {};
  notebook.footer ||= {};
  notebook.sidebar ||= {};
  notebook.noteDefaults ||= {};
  notebook.noteDefaults.sidebar ||= {};

  if (notebook.route.path) {
    if (notebook.route.path.startsWith("/")) {
      notebook.route.path = notebook.route.path.substring(1);
    }
    if (notebook.route.path.length > 1 && !notebook.route.path.endsWith("/")) {
      notebook.route.path = notebook.route.path + "/";
    }
  } else {
    const notebooksBaseDir = profilePath(profiles.notebookIndex.path);
    notebook.route.path = notebooksBaseDir ? `${notebooksBaseDir}/${id}` : id;
  }

  notebook.listing.order ??= 0;
  notebook.listing.excerpt_length ??= notebookDefaults.listing.excerptLength;
  notebook.listing.per_page ??= notebookDefaults.listing.perPage ?? ctx.config.per_page ?? 10;
  notebook.listing.sort ??= structuredClone(notebookDefaults.listing.sort);
  notebook.footer.license ??= notebookDefaults.footer.license ?? ctx.stellar.config.content.article.footer.license;
  notebook.footer.share ??= notebookDefaults.footer.share ?? ctx.stellar.config.content.article.footer.share;

  notebook.sidebar.left ??= { widgets: profiles.noteIndex.sidebar.left.slice() };
  notebook.sidebar.right ??= { widgets: profiles.noteIndex.sidebar.right.slice() };
  notebook.noteDefaults.sidebar.left ??= { widgets: profiles.note.sidebar.left.slice() };
  notebook.noteDefaults.sidebar.right ??= { widgets: profiles.note.sidebar.right.slice() };

  const tagMap = new Map(); // tagId: tagInfo
  notebook.tagTree = tagMap;

  const rootTag = {
    id: '',
    name: '',
    part: '',
    path: notebook.route.path,
    parent: null, // parent tag id
    childSet: new Set(), // child tag ids
    noteSet: new Set(), // note ids
  };
  tagMap.set(rootTag.id, rootTag);

  // Iterate through all notes in the notebook, build the tag tree.
  for (const page of pages) {
    rootTag.noteSet.add(page.id);

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
            path: `${notebook.route.path}/tags/${tagId}`,
            parent: parent.id,
            childSet: new Set(),
            noteSet: new Set(),
          };
          tagMap.set(tagId, tag);
          parent.childSet.add(tagId);
        }

        tag.noteSet.add(page.id);
        parent = tag;
      }
    }
  }

  notebook.noteMap = pages.reduce((map, note) => {
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

function getNotebooksObject(ctx, options = {}) {
  const notebooks = {
    tree: {},
  };

  const data = ctx.stellar?.contentConfig?.collectionConfigs || new Map();
  const pageConfigs = ctx.stellar?.contentConfig?.pageConfigs || new Map();
  const pagesByNotebook = options.pagesByNotebook || groupPagesByNotebook(ctx.locals.get("pages").data, pageConfigs);
  const list = [];
  for (const [key, value] of data) {
    if (!key.startsWith('notebooks/') || key.endsWith('.DS_Store')) {
      continue;
    }
    const id = key.substring(10);
    const info = structuredClone(value);
    list.push(prepareNotebook(id, info, ctx, pagesByNotebook.get(id) || []));
  }
  list.sort((a, b) => a.listing.order - b.listing.order);
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
