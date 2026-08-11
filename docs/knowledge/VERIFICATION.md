# 核查与修正记录

> 记录中文知识库对照 `themes/stellar/` 源码（版本 1.38.0，HEAD ebbd058）核查与修正的偏差记录。
> 规则：行号引用一律改为文件路径；无法在代码中找到对应实现的主张保留原文并标注「未核实」。

## 一、已移除功能（整页改写为当前实现）

| 原始页面 | 问题 | 修正 |
|----------|------|------|
| 8.4 PJAX and Seamless Navigation | 整篇描述已删除的 PJAX（v1.35.0 移除，见 `docs/designs/2026-08-08-pjax-removal.md`） | 改写为「页面导航与预加载」：整页导航 + `plugins.preload`（flying_pages） |
| 1 Overview（Phase 4）、3/3.1、6/6.1、7.1、8/8.3/8.5、10.1/10.3 | 多处 PJAX 内容（pjax.ejs、pjax.js、pjax.styl、pjax:complete、page-loading-bar、StellarPjaxConfig 等） | 删除/改写为整页导航机制 |
| 6.1/6.4 等 | `stellar.initComments` 评论注册表、`utils.jq()`/jQuery 依赖 | 主题无 jQuery、无 initComments；评论经各自 partial 在页面加载时初始化 |
| 2/6.1/6.4/7.2/8 技术栈与依赖 | jQuery 列为依赖 | 已移除；`dependencies` 仅 marked + lazyload |
| 3.2/7/7.1 小部件 | `layout/_partial/sidebar/*.ejs` 路径 | 实际为 `layout/_partial/widgets/*.ejs`（`_data/widgets.yml` 的 `layout` 字段指定） |
| 3.2/7 小部件 | `welcome` 组件 | 已不在 `_data/widgets.yml` 定义，配置引用不再渲染（已注明） |
| 8/8.1/10 评论模板 | `layout/_third-party/comments/*.ejs` | 实际为 `layout/_partial/comments/` |
| 1.1/1.2/3 等 | `npm-publish.sh` | 已移除，发布走 `.github/workflows/npm-publish.yml` |
| 2/1.2 样式文件 | `source/css/index.styl`、`source/css/_themes/_custom.styl` | 实际为 `source/css/main.styl`、`source/css/_custom.styl` |
| 5/5.3 标签插件样式 | `source/css/plugins/tags/*.styl`、`source/css/tags/`、`_defines/color.styl` | 实际为 `source/css/_components/tag-plugins/*.styl`；命名颜色定义在 `_defines/const.styl`（`$color-md-*`） |
| 10.3 性能 | PJAX 部分页面导航 | 改写为整页导航 + preload 预加载 |

## 二、版本与事实修正

| 位置 | 问题 | 修正 |
|------|------|------|
| 1.1/1 Overview 等 | 版本号 1.33.1 | 统一为 1.38.0 |
| 1.1 环境要求 | Node 14.17.3 ~ latest LTS | 实际要求 Node >= 22（README） |
| 1.1 依赖表 | 缺 `glob` | 补充 `glob ^10.4.0` |
| 1.2/3.3 | `site_tree.page.menu_id` | 当前 `site_tree.page` 无 `menu_id` 字段 |
| 1.2/8.1 评论 | `comments.lazyload` 配置键 | 不存在；评论懒加载始终经 `util.viewportLazyload` 启用 |
| 3.4/6.3 canonical | `canonical.encoded`、`canonical.closeEnable`、`canonical.closeText` 配置键 | `encoded` 由 `layout/_partial/scripts/defines.ejs` 计算；无 closeEnable/closeText 逻辑（旧版功能） |
| 4.5 错误页 | `site_tree.error_page.leftbar: recent, timeline` | 实际为 `recent`（rightbar 空） |
| 5.3/5.5/6.4 copy | `document.execCommand("Copy")` | 实际为 `navigator.clipboard.writeText()` |
| 6.1 initPage | 序列含「评论系统重初始化」 | 当前序列：toc、sidebar、wikiStart、leftbarScroll、relativeDate、registerTabsTag |
| 8.2 搜索 | `search.no_results` 等被误报为配置键 | 实为语言文件键（`languages/zh-CN.yml`），非 `_config.yml` 键 |
| 3.1 模板路由 | `layout/post.ejs`、`layout/wiki.ejs` | 不存在；内容页经 `layout.ejs` + `page.ejs` 按 `page.layout` 处理 |
| 2.5 动态头像 / sidebar-system 动态头像 | `animated_avatar.background` 图片背景（rainbow64@3x.webp） | 改为 CSS 锥形渐变：新增 `style.gradient.avatar`（默认搜索条同款彩虹色），移除 `animated_avatar.background`；光环旋转动画（4s）不变 |

## 三、处理约定

- **行号**：全部移除，改为纯文件路径（如 `_config.yml:101-104` → `_config.yml`）
- **Sources 行**：译为「参考源码」，仅保留已核实存在的文件路径
- **交叉引用**：原文 `#N.N` 锚点改为中文知识库相对路径链接
- **未核实项**：个别行为描述（如部分混入内部实现细节、旧版 API 响应格式）无法在当前代码逐一确认，保留原文描述；涉及已确认移除的功能均已改写

## 四、复查方式

```bash
cd docs/knowledge
python3 tools/verify.py        # 复查中文版硬事实（配置键/文件路径/版本）
```

## 五、复查结果

`python3 tools/verify.py zh` 结果：**行号异常 0、版本不一致 0**；未解析文件与配置键标记均为**有意保留**的内容，分类如下：

- 用户站点文件/示例：`source/_data/notebooks/*.yml`、`_data/wiki/*.yml`、`source/css/custom*.css`、`site-tokens.styl`、`layout/_plugins/custom_plugin.ejs` 等（知识库「如何做」章节中的示例路径）
- 已移除功能的历史引用：`plugins.pjax`、`layout/_plugins/pjax.ejs`、`source/js/plugins/pjax.js` 等（8.4 页面与各页面「PJAX 已移除」说明）
- 语言键/运行时字段：`search.search` 等为 `languages/*.yml` 键；`canonical.encoded` 为 `window.canonical` 运行时字段
- 生成产物/解析伪影：`search.json`、`main.css`、`args.json.json`、`data_services.xxx.js`、`.ejs`/`.styl` 裸扩展名
- 简写路径已自动补全：`_partial/*.ejs`（→ `layout/`）、`_defines|_common|_components|_plugins/*.styl`（→ `source/css/`）

以上标记不构成内容错误；如需消除报告噪音，可后续调整 `tools/verify.py` 的忽略列表。
