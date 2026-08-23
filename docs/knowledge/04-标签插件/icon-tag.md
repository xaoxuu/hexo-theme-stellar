---
title: 图标标签
---

# 图标标签

`{% icon %}` 在 Markdown 中渲染主题图标。处理器位于 `scripts/tags/lib/icon.js`，通过统一参数解析器读取图标 ID、颜色和内联策略，并用 `ctx.utils.icon()` 输出 SVG、异步占位符或外部图片。

## 默认颜色

```yaml
extensions:
  tags:
    icon:
      default_color: accent
```

处理器从冻结的 `ctx.stellar.config.extensions.tags.icon.defaultColor` 读取默认颜色。显式参数优先；`null` 表示继承文本颜色。旧标签配置根不兼容读取。

## 图标来源

- `source/_data/icons.yml` 登记图标键与 SVG/URL。
- `iconData()` 返回原始图标值。
- `icon()` 默认将本地图标输出为异步占位符，`inline:true` 时直接输出 SVG，URL 输出 `<img>`。
- `stellar_icon_sets` 生成器按命名空间输出 `/js/icons/{namespace}.json`。

所有静态引用由测试校验键存在，加载失败时保留空或资源兜底，不允许标签配置注入脚本。

## 参考源码

- [scripts/tags/lib/icon.js](../../../scripts/tags/lib/icon.js)
- [scripts/helpers/icon.js](../../../scripts/helpers/icon.js)
- [source/_data/icons.yml](../../../source/_data/icons.yml)
- [test/icon-helper.test.js](../../../test/icon-helper.test.js)
