# navbar 链接角形恢复与父容器一致

## 1. 背景

`2026-08-12-capsule-round-corner`（commit `fc1ccb2`）为 `.navbar nav a` 显式添加了 `corner-shape: round`，使胶囊按钮保持两端正圆端帽。但父容器 `.navbar-blur` / `.navbar-container` 自身未设置 `corner-shape`，随全局 `$corner-shape`（默认 `superellipse(1.2)`）渲染；链接按钮的正圆端帽与父容器胶囊外形出现曲率不一致。

目标：移除 `.navbar nav a` 的 `corner-shape: round` 覆盖，使导航链接角形跟随全局 `superellipse(1.2)`，与父容器保持一致。

## 2. 方案

- `source/css/_components/partial/navbar.styl`：删除 `.navbar nav a` 中的 `corner-shape: round` 及其注释（保留 `border-radius: 32px`，不支持的浏览器回退不变）。
- 知识库同步：`docs/knowledge/02-布局系统/logo-navigation-headers.md` 中「导航标签外观」描述改为链接不设 `corner-shape` 覆盖、跟随全局连续曲率。
- `docs/knowledge/VERIFICATION.md`「样式变更登记」补充本条变更。

## 3. 影响范围

- 仅影响 navbar top（`.navbar nav a`）胶囊按钮的角形状：从正圆端帽变为全局 superellipse 连续曲率，与父容器一致。
- `.float-panel` 的 `corner-shape: round` 保留，不受本次改动影响。
- 不涉及配置项、模板或脚本；不支持 `corner-shape` 的浏览器仍按 `border-radius` 回退渲染。

## 4. 验证

- 主题仓库 `npm run check`（lint + 单测 + 知识库核查）。
- 主工程 `npm run s` 预览首页/Wiki 页与移动端，检查 navbar top 链接角形与父容器胶囊外形连续一致。
