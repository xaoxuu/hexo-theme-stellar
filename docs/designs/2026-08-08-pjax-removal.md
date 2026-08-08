# 移除 PJAX 支持

> 日期：2026-08-08 | 作者：xaoxuu | 版本：v1.35.0

## 背景

自定义 PJAX 实现（~640 行）涉及 DOM diff / widget 合并 / 评论脚本重执行 / 滚动恢复等复杂逻辑，维护成本极高，边缘情况层出不穷。与 URL 规范化变动叠加后，交互放大效应导致点击无响应、部分更新失败、history 错乱等问题。

**核心结论**：PJAX 收益 < 维护成本，应移除。

## 改动清单

### 删除文件（3 个）

| 文件 | 说明 |
|------|------|
| `source/js/plugins/pjax.js` | PJAX 核心实现（~640 行） |
| `source/css/_plugins/pjax.styl` | PJAX 过渡动画样式（~62 行） |
| `layout/_plugins/pjax.ejs` | PJAX 配置注入和脚本加载模板（~8 行） |

### 修改文件（5 个）

| 文件 | 改动内容 |
|------|---------|
| `source/css/_plugins/index.styl` | 删除 PJAX 条件引入块（L17-18） |
| `layout/_partial/scripts/utils.ejs` | 删除 PJAX 相关代码：`_pjaxListeners`、`jq()` 的 `pjax` 参数逻辑、`cleanupPjaxListeners()`、`pjax:before`/`pjax:complete` 监听器。简化 `cleanupAll()`。`reinitPlugins()` 改为 internal 不再暴露。 |
| `source/js/main.js` | 删除 `pjax:complete` 事件监听（L319-321）和 PJAX 注释 |
| `layout/layout.ejs` | 删除 `.page-loading-bar` div（L72），仅 PJAX 使用 |
| `_config.yml` | 删除 `plugins.pjax` 配置块（L540-547） |

## 执行步骤

```
1. 删除 source/js/plugins/pjax.js
2. 删除 source/css/_plugins/pjax.styl
3. 删除 layout/_plugins/pjax.ejs
4. 修改 source/css/_plugins/index.styl - 删除 pjax 导入条件块
5. 修改 layout/_partial/scripts/utils.ejs - 清理 PJAX 相关代码
6. 修改 source/js/main.js - 删除 pjax:complete 监听
7. 修改 layout/layout.ejs - 删除 page-loading-bar
8. 修改 _config.yml - 删除 pjax 配置块
9. npm run g && npx gulp minify 验证构建
```

## 验证方法

1. `npm run g && npx gulp minify` 构建无报错
2. `npm run s` 本地预览，所有页面类型可正常访问：
   - 首页 `/`
   - 文章页 `/blog/xxx/`
   - Wiki 页 `/wiki/xxx/`
   - 分类/标签/归档页
   - 友链页
3. 页面间点击导航为完整刷新，无 JS 报错
4. 评论、搜索、代码高亮等插件均正常工作

## 影响评估

| 维度 | 影响 |
|------|------|
| UX | 页面切换有短暂白屏（完整刷新），但消除了卡死、部分加载等严重体验问题 |
| SEO | 无影响，搜索引擎爬虫不走 PJAX |
| 性能 | 页面切换时需重新请求完整 HTML/CSS/JS（flying_pages 预加载可缓解） |
| 兼容性 | 向后兼容，已有 `plugins.pjax` 配置会被忽略 |
| 维护成本 | 大幅降低（~710 行代码移除，消除复杂的状态管理逻辑） |
