# 检查清单 / 验证记录

- [x] 修复前浏览器测得 wrapper / 光环中心为 `(72, 72)`，头像图片中心为 `(74, 74)`。
- [x] 修复前 Topic 最终 Brand 图片等于该 Topic 的 `card.cover`。
- [x] 头像 wrapper、光环和图片中心一致；浏览器复测三者中心均为 `(72, 72)`。
- [x] Topic 配置不再把封面声明为 `identity.icon`。
- [x] Topic 文章 Brand 不读取 `card.cover`；Topic 默认继承站点 Brand。
- [x] `npm run check` 通过（191 项测试）。
- [x] 主工程 `npm run g` 通过（254 个生成文件）。
- [x] 三个仓库 `git diff --check` 通过。
