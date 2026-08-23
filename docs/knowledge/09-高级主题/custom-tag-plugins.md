---
title: 创建自定义标签插件
---

# 创建自定义标签插件

自定义标签由 `scripts/tags/lib/<name>.js` 实现，并在 `scripts/tags/index.js` 注册。处理器接收 Hexo 上下文，解析参数后返回可安全嵌入正文的 HTML。

## 基本结构

```js
/* global hexo */
"use strict";

module.exports = function(ctx) {
  return function(args, content) {
    var title = ctx.args.map(args).title || "";
    return `<span class="my-tag">${ctx.utils.escapeHTML(title)}</span>`;
  };
};
```

新增实现时同步：

1. 在 `scripts/tags/index.js` 注册标签；
2. 在 `source/css/_components/tag-plugins/` 增加组件样式并从索引引入；
3. 为参数解析、转义、空输入和输出结构补充测试；
4. 更新本知识库与设计文档。

## 配置边界

官方标签的跨页面默认位于 `extensions.tags.<tag_id>`，运行时从 `ctx.stellar.config.extensions.tags.<tagId>` 读取。新增官方 ID 必须同时登记在 `config-target.js` 和声明式 Schema，使用 snake_case YAML、camelCase JavaScript，并明确父级是封闭对象还是受约束动态记录。

不要从 `ctx.theme.config` 读取配置，不要在参数袋中开放 `js/css/inject`，也不要为旧字段添加兼容分支。若标签需要主题自带客户端模块，把资源登记到内部 Extension 资源表；若需要站点业务端点，将其放入明确的 `extensions.tags` 或 `extensions.services` 字段。

## 安全与降级

- 普通文本和属性必须转义；只有主题内部可信片段可原样输出。
- URL 参数需按用途校验，不把用户字符串拼成脚本。
- 动态服务失败时保留静态占位或默认图标，不阻断正文。
- 数组参数完整替换；对象只在已声明边界内合并；不做类型强转。

## 参考

- [标签插件风格指南](../../guides/tag-plugins-style-guide.md)
- [标签插件总览](../04-标签插件/tag-plugins-overview.md)
- [插件系统](../07-外部集成/plugin-system.md)
- [scripts/schema/config-schema.js](../../../scripts/schema/config-schema.js)
