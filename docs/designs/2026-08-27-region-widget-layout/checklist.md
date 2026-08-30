---
title: Stellar v2 Shell 与 Region 验证记录
date: 2026-08-27
---

# 验证记录

## 契约

- [x] Topbar/Leftbar/Rightbar 四层最后显式 Widget 数组覆盖、空数组清空与 `inherit` 拒绝。
- [x] 站点、Collection 与 Page 支持数组简写、空键和空子字段。
- [x] Leftbar 固定外壳字段级继承、`enabled: false` 与内容系统项拒绝。
- [x] `site_brand` / `collection_brand` 共享 Brand partial，按 Leftbar Site、Leftbar Collection、Topbar 输出差异化外观；图片静态展示，标语为单一字符串，图片与标题统一使用来源首页且不开放 URL 配置；Leftbar 固定槽位按来源选择，`render.layout.brands` 保持身份独立、无 GitHub 展示元数据且无隐式回退；Wiki 返回入口位于 Brand 内部最上方，使用通用 Brand Navigation 命名，`wiki_home` 不再属于 Widget Registry。
- [x] Search Menu Item 唯一性、共享 Dialog、范围投影与扩展关闭降级。
- [x] Settings 入口、支持 Provider 身份、安全头像及设置回退。
- [x] 旧 `sidebar/context/sidebarRail` 精确迁移诊断。
- [x] warning-only Doctor 保持 `ok: true`。

## Shell 与交互

- [x] 严格与过渡页面使用同一 Shell。
- [x] Topbar 位于 Workspace 外，Scrim/Dock 不参与 Workspace 几何。
- [x] Cover 位于 Shell 前，Side Surface 进入 Shell 后才固定并在 Shell 底部离场。
- [x] Workspace 无 Grid；桌面 Main 中线固定，中等宽度 Main 从 Leftbar 后开始，Leftbar/Rightbar 锚定逻辑方向边缘。
- [x] Leftbar 使用固定高度 Surface；桌面 Rightbar 与 Main 顶部对齐、按内容收缩且不超过可用视口，TOC 不再创建独立 Sticky。
- [x] Drawer 互斥、`inert`、ARIA、焦点、Escape 与 reduced-motion。
- [x] Leftbar 状态使用 `stellar:v2:leftbar-state`，旧键不迁移。
- [x] 停靠列与 Main 的间距不小于 `--gap-page`；Leftbar Drawer 不匹配 Rail 的仅图标样式。

## 最终门禁

- [x] `npm run check` 的 Lint、461 项测试、Schema 与 Reference；性能门禁使用 Node.js 22 单独复跑并刷新基线，gzip 降幅 46.40%。
- [x] `npm run knowledge:check`（61 页，零告警）
- [x] `npm run integration:check`（四套 Blueprint、空配置、两类迁移）
- [x] 主工程 `npm run g`（263 个文件）
- [x] 浏览器 `1440/1280/1181/1180/1024/769/768/667px` 视口矩阵：无横向溢出；桌面 Main 中线误差 0px，中等宽度 Main 与 Leftbar、右侧边缘保持最小页面间距。
- [x] 浏览器验证 Hero 进入时机、桌面 Main 中线、中等宽度 Leftbar 后布局、实际 64px Rail、Shell 约束 Surface 和 Drawer 交互。
- [x] 769–1180px Leftbar 常驻并直接持久化展开或 Rail 状态；≤768px 双 Drawer 互斥并恢复焦点。
- [x] 未运行 `acceptance:prepare`，未生成候选，未推进 M10/Alpha

## Appearance 按需编译候选（已取代，2026-08-28）

- 该候选的根级 `--appearance-*` 转发和 `<html data-appearance>` 方案已被语义视觉类契约取代，不再作为当前验收证据。

## Appearance 语义视觉类重构（2026-08-29）

- [x] Topbar/Leftbar 明确挂载 `.ui-surface`，Rightbar 只挂载 `.ui-drawer-surface`，Main 不挂视觉类。
- [x] 所有 preset 直接实现语义表面、正文、Collection、Markdown Widget、Navbar 和交互状态，不声明根级 Appearance 参数表；只有 Glass 输出连续覆盖层、多层阴影/滤镜与吸顶 Navbar 磨砂。
- [x] Leftbar 背景由当前 Appearance 独立实现：Flat/Minimal 透明、Card 使用 `var(--card)`、Glass 独立消费 `gradient/image`；通用 Sidebar 不再生成背景视觉。
- [x] 根级 `--appearance-*`、两个 `$appearance-*` 构建开关、PageViewModel `appearancePreset` 与 `<html data-appearance>` 已删除。
- [x] `appearance.preset` 仅由 Stylus compiler 与 Reference generator 消费，Visual Style ID、Blueprint CLI、公开 Region Schema 与配色切换接口不变。
- [x] Node 22 下主题 `npm run check`（501 项测试、Schema/Reference、性能）与主工程 `npm run g`（266 个文件）通过；浏览器确认 Flat Leftbar 透明并与 Topbar/视口边缘连接，Glass 图片与渐变分支均由装饰层生效；既有浅/深色桌面与 768px 双 Drawer 状态不变。
- [x] 未运行发布或 M10 候选门禁，M10/Alpha/人工验收状态保持未完成。

## Navbar 与 Topbar 吸顶融合（2026-08-29）

- [x] Topbar Viewport 填满实际内容高度，Widget Stack 与可见 Widget 在内容区垂直居中。
- [x] 有 Topbar 时 Navbar 保持原 Sticky 目标与层级；pinned 后按自身实际高度在内容区垂直居中，并移除背景、阴影、文字高光、滤镜与伪层。
- [x] 未吸顶 Navbar 保留独立卡片，不产生垂直位移。
- [x] 无 Topbar 页面保留旧 Sticky 位置与容器外观。
- [x] 四种 Appearance 定向编译、Lint、主工程生成与桌面/移动端浏览器验证通过。

定向证据：`node --test --test-name-pattern='Topbar 内容与吸顶 Navbar|Shell 使用内容高度 Rightbar|Card Topbar' test/appearance-final-convergence.test.js test/sidebar-client.test.js` 3/3，`npm run lint`，主工程 `npm run g` 生成 266 个文件。Glass 实站指定 Wiki 标签页在 `1440×900` 下 Topbar、Viewport、Widgets 与 pinned Navbar 的中心线均为 48px，Navbar 动态下移 2px；在 `390×844` 下中心线均为 52px，Navbar 动态下移 3.5px，横向导航保持 `536px > 314px` 的滚动溢出且首项从起点可见。无 Navbar 的文章页 Topbar、Viewport 与 Widget Stack 中心线均为 48px；未吸顶 Navbar 无位移，控制台无告警或错误。

相关文件的现有全集测试为 20/24；剩余 4 项是本任务开始前已存在的 Appearance 候选与旧断言不一致（Flat `bg-a20`、Minimal 内边距及 Leftbar 表面），与 Navbar/Topbar 融合无关，本次不扩大修改范围。

## Hero 过渡阶段 Topbar 与 Leftbar 间距（2026-08-29）

- [x] 存在 Topbar 的 Shell 在正常文档流中消费现有 `--shell-topbar-top`，使 Hero→Topbar 的自然位置与 Sticky 位置一致。
- [x] Leftbar 轨道顶部消费现有 `--leftbar-gap`，不增加 margin、padding、公开变量或运行时逻辑。
- [x] Surface 的 Sticky offset、面板高度和底部留白公式保持不变。
- [x] Glass 的 Hero→Topbar 与 Topbar→Leftbar 均保持 16px；Card 通栏 Topbar、Flat/Minimal 继续保持自身 0 顶部坐标，Leftbar 间距语义不变。
- [x] 1024px 常驻 Leftbar 使用相同轨道间距；390px Drawer 继续使用 Topbar 下方 80px 的显式顶部坐标，开合位置不叠加间距。
- [x] Hero 页面从完整可见、部分离场、Sticky 临界到完全离场均保持 16px；无首屏 Hero 的文章页仍保持 16px。

定向证据：`node --test --test-name-pattern='Shell 使用内容高度 Rightbar' test/sidebar-client.test.js` 1/1；`node --test --test-name-pattern='Topbar 正常流消费|Leftbar 轨道消费' test/appearance-final-convergence.test.js` 2/2，并在循环中编译四种 Appearance；`npm run lint` 通过；主工程 `npm run g` 生成 266 个文件。Glass 实站 `/wiki/stellar/` 在 `1440×900` 的滚动点 `0/700/800/850/868/884/900/1000` 均测得 Hero→Topbar 与 Topbar→Leftbar Surface 间距 16px；移动端 `390×844` 在 Hero 自然滚动和 Sticky 临界同样保持 16px，Drawer 顶部仍为 80px；`1024×768`、Hero 底部仍为 118px 时常驻 Leftbar 间距为 16px；无首屏 Hero 的 `/blog/20260815/` 在 `1440×900` 下 Topbar 顶部和 Leftbar 间距仍为 16px。三个浏览器场景控制台均为空。

相关两个测试文件的全集仍为 20/24；4 项失败与上节记录相同，均为本任务开始前已存在的 Appearance 表面断言，本次间距修改未触及对应规则。

## Rightbar 高度、停靠列间距与 Leftbar Drawer 内容（2026-08-29）

- [x] 桌面 Rightbar 与 Main 的实际内容起点对齐，统一消费 `--shell-content-top-gap`；短内容按实际高度收缩，长内容以扣除顶部留白后的 Shell 可用视口高度为上限并由 Viewport 独立滚动。
- [x] Hero 与普通页面滚动进入 Sticky 后，桌面 Rightbar 与 Topbar 底部持续保持 `--gap-base`；Rightbar Drawer 仍使用原满高定位。
- [x] 桌面及 769–1180px 常驻 Leftbar 的展开/折叠停靠列间距均不小于 `--gap-page`；Drawer 不参与列预留。
- [x] Leftbar Drawer 不命中 Rail mixin 或 Settings 的 collapsed 仅图标规则；Brand、Menu、Settings 与普通 Widget 在桌面偏好为 expanded/collapsed 时均完整显示。
- [x] Rightbar 在 769–1180px 继续使用满高 Drawer，不继承桌面内容高度上限。

定向证据：`node --test --test-name-pattern='Leftbar 折叠状态|平板与手机 Drawer|常驻并持久化|从 Leftbar 后开始' test/sidebar-client.test.js` 4/4；`node --test --test-name-pattern='四种 Appearance 的停靠列间距' test/appearance-final-convergence.test.js` 1/1，并循环编译四种 Appearance；相关文件 ESLint 与主工程 `npm run g`（266 个文件）通过。浏览器在 `1181/1180/1024/769/768px` 下均无横向溢出：1181px Main 中线误差 0；1180/1024/769px Leftbar 均以 264px 常驻，Main 与其保持 16px 间距并分别使用 720/704/449px 宽度；768px Main 恢复居中且两个 Side Region 均为 Drawer。1024px 手动折叠后 Leftbar 为 64px，Main 从 x=296 移到 x=96 并保持 16px 间距；控制台无告警或错误。`sidebar-client.test.js` 的旧综合测试仍有本任务前已存在的 `--shell-content-top-gap` 断言不一致，本次不扩大范围。
