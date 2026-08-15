# 执行计划

1. 修改 `source/css/_components/partial/navbar.styl`：`.navbar-blur` 基础态改为卡片样式，`&.pinned` 恢复 `bar-glass()` 玻璃效果。
2. 修改 `source/js/main.js`：`init.navbarBlur()` 改为 `init.navbarPin()`（吸顶边界切换 `.pinned` 类），更新注册。
3. 主题仓库 `npm run check` 验证（lint + 单测 + 知识库硬事实核查）。
4. 主工程 `npm run g` 全量构建验证（含 gulp minify / Babel 转译）。
5. 同步知识库：`logo-navigation-headers.md`、`client-side-overview.md`、`知识库全量.md`、`VERIFICATION.md`。
6. 主仓库核对并更新 `source/wiki/stellar/advanced-settings.md`（刷新 `updated`）。
7. 改动保留在工作区供用户审查，不自动提交。
