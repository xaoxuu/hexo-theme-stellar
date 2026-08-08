# 修复 pretty_urls 实现

> 日期：2026-08-08 | 作者：xaoxuu | 版本：v1.36.0
>
> 前置依赖：v1.35.0（PJAX 移除）

## 背景

当前 URL 规范化在**三个层面**同时起作用：

| 层面 | 文件 | 作用 | 问题 |
|------|------|------|------|
| Hexo 配置层 | `scripts/events/lib/config.js` L19-23 | 强制设置 `trailing_index=false`、`trailing_html=false` | 侵入 Hexo 内部行为，可能与其他插件冲突 |
| 生成器层 | `scripts/filters/pretty_urls.js` | 覆写 page generator，把 `.html` 转为 `/index.html` | 冗余逻辑，Hexo `pretty_urls` 配置已处理此问题 |
| 模板层 | `scripts/helpers/pretty_url.js` | EJS 模板中调用，规范化输出链接 | 这是正确的层级，但逻辑可简化 |

## 修复策略

**原则**：URL 规范化应该只在**模板输出层**做，不要修改 Hexo 内部行为。

## 改动清单

### 删除文件（1 个）

| 文件 | 说明 |
|------|------|
| `scripts/filters/pretty_urls.js` | 覆写 page generator 的冗余逻辑 |

### 修改文件（3 个）

| 文件 | 改动内容 |
|------|---------|
| `scripts/events/lib/config.js` | 删除 `override_pretty_urls` 逻辑块（L19-23）。不再强制覆写 Hexo 的 `pretty_urls` 配置，改为依赖用户在 `_config.yml` 中的正确配置。 |
| `scripts/helpers/pretty_url.js` | 简化逻辑：移除 `.html` → `/` 的二次处理，因为 Hexo `pretty_urls` 已处理。只保留 `index.html` → `/` 替换和路径规范化。增加空值保护。 |
| `_config.yml` | 删除 `system.override_pretty_urls` 配置项（L731-733）。在 `_config.yml` 的注释中补充推荐配置说明，引导用户在 Hexo 层配置 `pretty_urls`。 |

### pretty_url() 精简后逻辑

```js
'use strict';

hexo.extend.helper.register('pretty_url', function (path = '') {
  if (!path) return '/';
  if (path.startsWith('http://') || path.startsWith('https://')) {
    return path;
  }

  let url = this.url_for(path);

  // 统一去掉 /index.html 后缀
  url = url.replace(/\/index\.html$/, '/');

  // 如果没有扩展名且不以 / 结尾，补 /
  const hasExtension = /\.[a-zA-Z0-9]+$/.test(url);
  if (!hasExtension && !url.endsWith('/')) {
    url += '/';
  }

  // 去除多余斜杠
  url = url.replace(/([^:]\/)\/+/g, '$1');

  return url;
});
```

核心变化：
- 移除 `.html` → `/` 的替换（Hexo `pretty_urls` 配置已处理，重复处理可能引入 bug）
- 增加空路径保护（`!path` → 返回 `/`）

## 用户侧配合配置

用户需确保 `_config.yml`（Hexo 根配置，非主题配置）中正确设置：

```yaml
# _config.yml
pretty_urls:
  trailing_index: false   # 不输出 /index.html
  trailing_html: false    # 不输出 .html
```

## 执行步骤

```
1. 删除 scripts/filters/pretty_urls.js
2. 修改 scripts/events/lib/config.js - 删除 override_pretty_urls 逻辑
3. 修改 scripts/helpers/pretty_url.js - 精简逻辑
4. 修改 _config.yml - 删除 override_pretty_urls 配置，补充推荐配置注释
5. npm run g && npx gulp minify 验证构建
```

## 验证方法

1. `npm run g` 构建无报错
2. 检查生成的 `public/` 目录下文件路径格式统一为 `/xxx/` 风格
3. `npx gulp minify` 无报错
4. 所有页面中 `canonical` 链接格式正确
5. 站点地图 `sitemap.xml`、RSS `atom.xml` 中链接格式正确

## 影响评估

| 维度 | 影响 |
|------|------|
| UX | 无感知 |
| SEO | canonical 更稳定，对 SEO 有正向帮助 |
| 性能 | 无影响 |
| 兼容性 | 用户需在 Hexo 层配置 `pretty_urls`，需更新文档 |
| 维护成本 | 显著降低（删除冗余的 generator 覆写和强制配置） |
