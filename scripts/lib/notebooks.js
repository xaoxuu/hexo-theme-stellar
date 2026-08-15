/**
 * notebooks.js v1
 *
 * 笔记本系统构建（纯函数部分，供 events/lib/notebooks.js 调用与单测覆盖）。
 * 把「每个笔记本全量 filter 一遍全部页面」改为单遍分组（O(NB+P) 替代 O(NB*P)），
 * 标签树与 noteMap 构建逻辑和元素顺序不变。
 */

'use strict';

const { normalize_path } = require('./path_utils');

class NotePage {
  constructor(page) {
    this.id = page._id;
    this.notebook = page.notebook;
    this.title = page.title;
    this.tags = page.tags;
    this.path = page.path;
    this.path_key = normalize_path(page.path);
    this.layout = page.layout;
    this.date = page.date;
    this.updated = page.updated || page.date;

    const pin = page.pin ?? page.sticky ?? 0;
    if (pin === true) {
      this.pin = 1;
    } else if (pin === false) {
      this.pin = 0;
    } else {
      this.pin = pin;
    }
  }
}

function splitTag(tag) {
  return tag.split('/').filter(t => t.length > 0);
}

/**
 * 单遍按 notebook id 分组页面。
 * 等价的旧逻辑：对每个笔记本执行 allPages.filter(p => p.notebook === notebook.id)。
 * @param {Array} pages 页面数组（warehouse Query 的 .data）
 * @returns {Map<string, Array>}
 */
function groupPagesByNotebook(pages) {
  const pagesByNotebook = new Map();
  for (const page of pages) {
    if (page.notebook == null) {
      continue;
    }
    let arr = pagesByNotebook.get(page.notebook);
    if (arr == null) {
      arr = [];
      pagesByNotebook.set(page.notebook, arr);
    }
    arr.push(page);
  }
  return pagesByNotebook;
}

function prepareNotebook(id, info, ctx, pages) {
  const notebook = info;
  notebook.id = id;

  if (notebook.base_dir) {
    if (notebook.base_dir.startsWith('/')) {
      notebook.base_dir = notebook.base_dir.substring(1);
    }
    if (notebook.base_dir.length > 1 && !notebook.base_dir.endsWith('/')) {
      notebook.base_dir = notebook.base_dir + '/';
    }
  } else {
    const notebooksBaseDir = ctx.theme.config.site_tree.notebooks.base_dir;
    notebook.base_dir = notebooksBaseDir ? `${notebooksBaseDir}/${id}` : id;
  }

  notebook.sort ||= 0;
  notebook.auto_excerpt ||= ctx.theme.config.notebook.auto_excerpt || 0;
  notebook.per_page ??= ctx.theme.config.notebook.per_page ?? ctx.config.per_page ?? 10;
  notebook.order_by ||= ctx.theme.config.notebook.order_by || '-updated';
  notebook.menu_id ??= ctx.theme.config.site_tree.notes.menu_id;
  notebook.license ??= ctx.theme.config.notebook.license;
  notebook.share ??= ctx.theme.config.notebook.share;

  notebook.leftbar ??= ctx.theme.config.site_tree.notes.leftbar;
  notebook.rightbar ??= ctx.theme.config.site_tree.notes.rightbar;
  notebook.note_leftbar ??= ctx.theme.config.site_tree.note.leftbar;
  notebook.note_rightbar ??= ctx.theme.config.site_tree.note.rightbar;

  const tagMap = new Map(); // tagId: tagInfo
  notebook.tagTree = tagMap;

  const rootTag = {
    id: '',
    name: '',
    part: '',
    path: notebook.base_dir,
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
            path: `${notebook.base_dir}/tags/${tagId}`,
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
  list.sort((a, b) => a.sort - b.sort);
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
