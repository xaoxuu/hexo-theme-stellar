# 左栏 linklist 多列布局链接背景色

## 1. 背景

左栏独立 `linklist` 小部件（`.widget-wrapper.linklist`）在多列布局（`columns > 1`）下，链接项与背景同色、缺乏卡片感；单列列表已有左侧布局样式，无需背景。目标：多列布局的每个链接显示背景色，且随左栏 UI 风格自适应——`card` 为 `var(--block)`，`glass` 为 `var(--bg-a20)`，hover/active 保持现有高亮。

## 2. 方案

- 模板 `layout/_partial/widgets/components/linklist.ejs`：`columns > 1` 时给 `.linklist` 容器追加 `multi` 类（`columns` 是模板中唯一决定每行元素数的机制；单列列表的 `left` / 单链接的 `center` 逻辑不变）。
- 样式 `source/css/_components/widgets/components.styl` 新增左栏限定规则：

  ```styl
  .l_left .widget-wrapper.linklist .linklist.multi .link
    background: var(--bg-a20)
    &:hover, &.active
      sidebar-light()
  ```

  - 背景用 `var(--bg-a20)`：`glass` 下即 `--bg-a20`；`card` 下由 `.l_left.leftbar-card` 既有变量覆盖机制（`--bg-a20: var(--block)`）自动得到 `--block`，复用现有风格隔离机制，不新增配置。
  - 同作用域补 `sidebar-light()` hover/active 规则，避免新背景（特异性更高）盖掉现有玻璃渐变 / card `--block-border` 高亮；图标渐变规则（`--item-grad`）仍由 `.l_left .linklist .link` 提供。
  - 作用域限定 `.widget-wrapper.linklist`，不影响 markdown 小部件内 linklist 与右栏。

## 3. 影响范围

- 主题文件：`layout/_partial/widgets/components/linklist.ejs`、`source/css/_components/widgets/components.styl`。
- 对使用该主题的站点：左栏 linklist 小部件多列布局的链接项新增背景色；单列、单链接、markdown 小部件、右栏不变。
- 需要同步的知识库：`docs/knowledge/02-布局系统/sidebar-system.md`（card 风格组件填充段落）、`docs/knowledge/知识库全量.md`、主仓库 `source/wiki/stellar/sidebar.md`。

## 4. 验证

- 主题仓库 `npm run check`（lint + 单测 + 知识库核查）与 `python3 docs/knowledge/tools/verify.py`。
- 主工程 `npm run g` 全量构建；`npm run s` 预览：`style.leftbar.ui-style` 取 `card` / `glass` 两种，对比多列 linklist（`columns` 2/3/4）背景色；单列、单链接、`columns > 链接数` 边界；浅色/深色模式、桌面/移动端；hover 与 active 无回归。
- 知识库核查无版本/行号偏差，`docs/knowledge/VERIFICATION.md` 无需登记（本次无偏差）。
- 提交：主题仓库 `style(sidebar): linklist 多列项按 leftbar 风格显示背景色`。
