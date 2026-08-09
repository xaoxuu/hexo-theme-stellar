# 懒加载与 fancybox 配置简化

> 日期：2026-08-09 | 状态：已实施

## 问题

1. `img_lazyload.js` 读取 `plugins.lazyload.enable`，该键从未声明，正文图片懒加载过滤器实际永远关闭。
2. `lazyload.styl` 读取 `plugins.lazyload.transition`，配置却声明在 `dependencies.lazyload.transition`，过渡配置失效。
3. `{% image %}` 输出 `src` 与 `data-src` 相同的真实地址，图片在解析期即被下载，假懒加载。
4. fancybox 配置多层叠加（enable / 页面覆盖 / tag_plugins / comments / selector），`with-fancybox` 类导致有评论的帖子无条件加载。
5. `comments.lazyload` 默认 false，与懒加载目标相反。

## 方案

- 懒加载强制开启：`dependencies.lazyload` 为唯一配置位置（js / transition / fix_ratio），删除 enable 判断；`no-lazy` 为唯一例外。
- 修复过滤器：跳过 `data-src` / `no-lazy`（含 `no-lazy=""`）/ `srcset` 图片。
- `{% image %}` 输出 1x1 占位 src + 真实 data-src。
- 淡入动画改 keyframes（transition 在缓存图片瞬间加载时无起点会直接闪现），`.lazy` 基础规则同时覆盖 `div.lazy.img` 封面/横幅；`lazyLoadOptions` 声明移到 async 库之前消除自初始化竞态。
- fancybox 改为 `mode: auto | global`；评论区图片（artalk/twikoo/waline）显示较小，容器标记 `.with-fancybox` 自动支持弹窗；`{% image fancybox:false %}` 单图例外保留。
- 评论系统移除 `comments.lazyload`，统一视口懒加载。

## 改动文件

- `scripts/filters/lib/img_lazyload.js`
- `scripts/tags/lib/image.js`
- `source/css/_plugins/lazyload.styl`
- `layout/_partial/scripts/lazyload.ejs`
- `layout/_plugins/fancybox.ejs`
- `layout/_partial/comments/*/script.ejs`（6 个）
- `layout/_partial/comments/artalk/layout.ejs`
- `layout/_partial/comments/twikoo/layout.ejs`
- `layout/_partial/comments/waline/layout.ejs`
- `_config.yml`

## 验证

- `npm run g && npx gulp minify` 全量验证（scripts/ 变更强制要求）
- 抽查首页、文章页、Wiki 页、404 页的脚本注入与图片输出
- 无头 Chrome 实测淡入时序：新 CSS 缓存图片场景 opacity 0→1 平滑渐变，旧 CSS 直接跳 1
