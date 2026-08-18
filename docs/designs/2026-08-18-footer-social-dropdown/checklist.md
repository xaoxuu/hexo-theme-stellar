---
title: Footer Social 通用下拉菜单检查清单
date: 2026-08-18
---

# 检查清单 / 验证记录

## 验证

- [x] 普通 social 条目保持原有渲染
- [x] Footer dropdown 复用通用 `.dropdown` 样式
- [x] `{% dropdown %}` 主按钮和子项正确渲染
- [x] `{% dropdown %}` 主按钮固定使用圆角端点 SVG 箭头，展开时旋转 180°
- [x] dropdown 的方向、对齐和最大高度行为正确
- [x] dropdown 通过全局浮层脱离桌面/移动端 sidebar 容器裁剪
- [x] dropdown 未指定方向时根据视口空间自动选择上下方向
- [x] dropdown 未指定对齐时贴合触发按钮左边或右边，不使用居中对齐
- [x] 鼠标 hover 触发按钮时展开，跨越触发按钮与菜单间隙时保持展开
- [x] dropdown 出现时使用淡入动画，并支持减少动态效果
- [x] 鼠标离开触发按钮、菜单和透明桥接区后立即关闭，不使用延迟计时器
- [x] 菜单左右偏移时，透明桥接区仍覆盖斜向移动路径
- [x] Footer dropdown 可以按 `footer.social` 顺序插入任意位置
- [x] dropdown 菜单使用主题通用玻璃背景，并适配明暗主题
- [x] 内链、外链和属性转义正确
- [x] 首页 / 文章页 / Wiki 页均可渲染
- [x] `python3 docs/knowledge/tools/verify.py` 通过
- [x] 主工程 `npm run g` 通过

验证结果：

- 使用临时通用 dropdown 配置完成主工程构建，并检查首页 Footer 与 Wiki 标签页生成 HTML；临时配置已移除。
- `npm run lint` 通过；`npm test` 的 135 项测试全部通过；知识库核查命令通过。
- 知识库核查仍报告仓库既有的 54 个未解析文件、11 个配置键异常；本次新增条目未引入新的异常。

## 文档同步

- [x] `docs/knowledge/04-标签插件/tag-plugins-overview.md` 已更新
- [x] `docs/knowledge/02-布局系统/sidebar-system.md` 已更新
- [x] `docs/knowledge/00-总览与安装配置/configuration.md` 已更新
- [x] `docs/knowledge/VERIFICATION.md` 已登记
- [x] 主工程 `source/wiki/stellar/sidebar.md` 已更新
- [x] 主工程 `source/wiki/stellar/tag-plugins/container.md` 已更新
