# 检查清单

## 开发

- [x] icons.yml 新增键完整，无重复、无缺失（98 键，单测校验）
- [x] 服务端替换后 `rg '<svg'`（layout/scripts/source/js）无硬编码（仅 grad-def 渐变定义保留）
- [x] CSS 变量注入生效，story 页装饰正常（构建产物含 `--icon-h3-left/right`、`--icon-quote-left/right`）
- [x] 客户端 `ctx.icons` 注入生效，weibo/timeline/utils 图标正常
- [x] 知识库文档与 VERIFICATION.md 已同步

## 验证

- [x] 主题仓库 `npm run check` 通过（lint + 单测 + 依赖声明 + 知识库核查）
- [x] 主工程 `npm run g` 全量构建通过（216 文件生成 + minify）
- [x] 页面抽查：story 装饰 CSS 变量、懒加载占位（icons.yml URL）、weibo/timeline（ctx.icons）、chat 无泄漏 key、客户端注册表无 SVG 注释
