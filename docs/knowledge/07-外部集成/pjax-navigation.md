---
title: 页面导航与预加载
domain: 外部集成
tags:
  - 导航
  - View Transition
  - 预加载
  - flying_pages
  - PJAX
---

# 页面导航与预加载

<details>
<summary>相关源码文件</summary>

生成此页面时参考的主题源码文件：

- [_config.yml](../../../_config.yml)（`style.page_transition`、`plugins.preload` 小节）
- [source/css/_components/page-transition.styl](../../../source/css/_components/page-transition.styl)
- [layout/_plugins/preload.ejs](../../../layout/_plugins/preload.ejs)
- [layout/_partial/scripts/defines.ejs](../../../layout/_partial/scripts/defines.ejs)
- [docs/designs/2026-08-08-pjax-removal.md](../../../docs/designs/2026-08-08-pjax-removal.md)
- [docs/designs/2026-08-20-cross-document-page-transition/spec.md](../../../docs/designs/2026-08-20-cross-document-page-transition/spec.md)

</details>

## 概览

Stellar 使用**普通整页导航**。早期版本曾内置自定义 PJAX 实现（约 640 行，涉及 DOM diff、小部件合并、评论脚本重执行、滚动恢复等复杂逻辑），因维护成本极高且边缘情况层出不穷，已于 **v1.35.0（2026-08-08）移除**。当前主题在整页导航之上使用原生跨文档 View Transition 平滑衔接同源页面，并通过 `plugins.preload`（flying_pages）在鼠标悬停时预加载站内链接；两者均不改变页面脚本的单次初始化模型。

## PJAX 移除背景

自定义 PJAX 实现涉及：

- DOM diff / 小部件合并
- 评论脚本重执行
- 滚动恢复

维护成本极高，与 URL 规范化变动叠加后产生点击无响应、部分更新失败、history 错乱等问题。核心结论：PJAX 收益 < 维护成本，应移除。

**移除内容：**

| 文件 | 说明 |
|------|------|
| `source/js/plugins/pjax.js` | PJAX 核心实现（约 640 行） |
| `source/css/_plugins/pjax.styl` | PJAX 过渡动画样式（约 62 行） |
| `layout/_plugins/pjax.ejs` | PJAX 配置注入与脚本加载模板（约 8 行） |
| `_config.yml` 的 `plugins.pjax` 配置块 | PJAX 启用配置 |
| `layout/layout.ejs` 的 `.page-loading-bar` | 仅 PJAX 使用的页面加载条 |

同时从 `source/css/_plugins/index.styl` 移除 PJAX 条件引入块，从 `layout/_partial/scripts/utils.ejs` 清理 `_pjaxListeners`、`jq()` 的 pjax 参数逻辑、`cleanupPjaxListeners()`、`pjax:before`/`pjax:complete` 监听器等。

**参考源码**：[docs/designs/2026-08-08-pjax-removal.md](../../../docs/designs/2026-08-08-pjax-removal.md)

## 当前导航机制

### 整页导航

主题使用标准整页导航：点击内部链接触发浏览器完整页面加载，每次加载重新执行：

- `stellar.initPage()`——初始化 TOC、侧边栏、相对日期、标签页等交互
- `init.canonicalCheck()`——规范链接与克隆站检测（仅初始加载）
- 懒加载扫描——`lazyLoadInstance.update()`

无需 PJAX 式的 DOM 部分更新、小部件合并或脚本重执行逻辑。

**参考源码**：[source/js/main.js](../../../source/js/main.js)

### 跨文档页面过渡

默认配置如下：

```yaml
style:
  page_transition:
    enable: true
```

启用后，主题输出 `@view-transition { navigation: auto; }`，由浏览器为同源、用户触发的整页导航保留旧页面快照，直到新文档首帧可以呈现。`.l_left` 使用独立的 `view-transition-name: leftbar`：内容未变化时左栏保持视觉连续，内容变化时与新页面自然交叉过渡；页面 DOM 仍会完整重建，不保留左栏运行状态。

根页面和左栏统一使用 `0.2s ease-out`。`prefers-reduced-motion: reduce` 下关闭跨文档动效。将 `style.page_transition.enable` 设为 `false` 时不输出相关规则；不支持该能力的浏览器也会忽略规则并回退普通整页导航。跨域链接、刷新、地址栏导航和页内锚点不由该能力接管。

**参考源码**：[source/css/_components/page-transition.styl](../../../source/css/_components/page-transition.styl)、[_config.yml](../../../_config.yml)

### 锚点滚动处理

`layout/_partial/scripts/defines.ejs` 内置锚点滚动处理：等待布局稳定后（懒加载图片/异步组件完成前布局可能变化）再滚动到目标锚点：

- `#start` 锚点贴顶，不预留偏移
- 其余锚点与 TOC 点击滚动保持一致（32px 偏移）
- 带重试与静默窗口，避免原生锚点滚动在长文章中位置偏移

**参考源码**：[layout/_partial/scripts/defines.ejs](../../../layout/_partial/scripts/defines.ejs)

## Preload 预加载插件

### 配置

```yaml
plugins:
  preload:
    enable: true
    service: flying_pages # flying_pages
    flying_pages: https://gcore.jsdelivr.net/npm/flying-pages@2/flying-pages.min.js
```

| 字段 | 说明 |
|------|------|
| `enable` | 是否启用预加载 |
| `service` | 预加载服务（当前支持 `flying_pages`） |
| `flying_pages` | flying-pages 库的 CDN URL |

### 工作方式

flying-pages 在**鼠标悬停**到站内链接时预取目标页面（延迟 65ms 防误触、视口内优先、避开非链接资源），用户点击时页面已缓存，导航几乎瞬时完成。这是对整页导航的有效补充，兼顾简单可靠与体感速度。

**参考源码**：[_config.yml](../../../_config.yml)、[layout/_plugins/preload.ejs](../../../layout/_plugins/preload.ejs)

## 与其他系统的关系

| 系统 | 关系 |
|------|------|
| 前端初始化（`stellar.initPage()`） | 整页导航下每次加载执行一次，无需幂等重入设计 |
| 懒加载图片 | 每次页面加载经 `lazyLoadInstance.update()` 扫描 |
| 评论系统 | 每次页面加载经视口懒加载初始化，无 PJAX 重初始化需求 |
| 滚动恢复 | 浏览器原生 `history.scrollRestoration = 'auto'` |
| 页面过渡 | 只保存前后页面的视觉快照，不复用 DOM 或脚本状态 |

**参考源码**：[layout/_partial/scripts/defines.ejs](../../../layout/_partial/scripts/defines.ejs)

## 性能考虑

- 整页导航消除 PJAX 的复杂状态管理，减少边缘错误
- 原生跨文档 View Transition 遮蔽新文档首帧前的白屏，并让左栏独立平滑衔接
- preload 在保留导航体感速度的同时避免 PJAX 的 DOM 合并开销
- 脚本与样式按页面实际需要加载，无 PJAX 相关的额外缓存与更新逻辑

**参考源码**：[_config.yml](../../../_config.yml)、[source/css/_components/page-transition.styl](../../../source/css/_components/page-transition.styl)
