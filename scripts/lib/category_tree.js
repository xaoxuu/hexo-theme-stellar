'use strict';

// 分类嵌套树构建（#564）：基于 parent 关系递归组装，兼容 2/3/4 级
function buildCategoryTree(list) {
  const items = (list || []).map(c => ({
    _id: c._id,
    name: c.name,
    path: c.path,
    parentId: c.parent ? (typeof c.parent === 'object' ? c.parent._id : c.parent) : null,
    count: (c.posts && c.posts.length) || 0,
    children: []
  }));
  const byId = {};
  items.forEach(item => { byId[item._id] = item; });
  const roots = [];
  items.forEach(item => {
    if (item.parentId != null && byId[item.parentId]) {
      byId[item.parentId].children.push(item);
    } else {
      roots.push(item);
    }
  });
  return roots;
}

module.exports = { buildCategoryTree };
