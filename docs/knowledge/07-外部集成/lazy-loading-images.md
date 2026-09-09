---
title: 懒加载与图片处理
domain: 外部集成
tags:
  - 懒加载
  - 图片
  - vanilla-lazyload
---

# 懒加载与图片处理

## 配置

```yaml
features:
  image_optimization:
    enabled: true
  lazy_loading:
    transition: fade
    auto_aspect_ratio: true
```

图片优化默认在 `hexo server` / `hexo generate` 时增量补齐尺寸和平均色，不压缩、替换原图或修改 Markdown。`features.image_optimization.enabled: false` 停止自动预处理，但仍复用已有结果，也允许手动运行命令。`features.lazy_loading.auto_aspect_ratio` 控制尺寸与比例的自动补全；显式图片尺寸优先。

## 持久元数据

结果存放在站点 `source/_data/caches/images_metadata.json`，按实际生成 HTML 中的图片 URL 收集，覆盖 Markdown、标签与数据驱动封面。本地图片读取 Hexo 资源路由，远程图片限时下载；尺寸与 HSLA 平均色增量保存，完整条目跳过，失败记录延迟重试。预处理失败记录 warning，不阻止正常构建。

元数据文件采用锁与原子写入，并从 Hexo 数据扫描及文件监听排除，避免写入引发重复构建。颜色计算使用 Sharp，尺寸也可由 probe-image-size 提取；不支持的格式保留可用结果。浏览器优先使用生成时注入的颜色信息，动态图片由共享图片颜色运行时处理。

```sh
hexo stellar images
hexo stellar images --dry-run
hexo stellar images --page wiki/example/index.html
hexo stellar images --refresh https://example.com/image.png
```

`--dry-run` 报告缺失项，不下载图片或写入元数据；`--page` 限定生成路由；`--refresh` 强制重算单张图片。

## 懒加载生命周期

独立的 `lazy-loading.js` Extension 在加载 vanilla-lazyload 前设置全局选项并监听初始化事件。脚本已缓存时可显式创建实例。动态 `.lazy` 节点由 MutationObserver 注册，数据服务可通过 `wrapLazyloadImages()` 包装普通图片。卸载时断开 observer、移除事件并销毁实例。

成功加载后移除加载指示；错误占位处理保留懒加载时序，避免图片尚未真正加载就提前替换。图片标签、画廊、轮播和媒体卡片保持原始比例。

相关源码：[元数据处理](../../../scripts/lib/image-metadata.js)、[命令](../../../scripts/commands/stellar.js)、[懒加载](../../../source/js/runtime/extensions/lazy-loading.js)、[图片颜色](../../../source/js/runtime/image-color.js)、[错误图片](../../../scripts/filters/lib/img_onerror.js)。
