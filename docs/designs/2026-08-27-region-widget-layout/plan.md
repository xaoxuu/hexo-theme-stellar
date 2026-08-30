---
title: Stellar v2 Shell 与 Region 执行计划
date: 2026-08-27
---

# 执行计划

1. [x] 发布 #735，并在 #734 标记其取代旧 Region 命名、Shell、响应式与 Sticky 决定。
2. [x] 重命名 Schema、级联、Widget Registry、PageViewModel 与 Doctor 契约，并接受数组简写、空键和空子字段。
3. [x] 严格与过渡页面统一消费命名槽 Shell，移除 `.l_*` 外层 DOM 与内联 `sidebar.*()`。
4. [x] 移除 Workspace Grid，以 Shell 内双侧固定 Surface、桌面视口中心 Main、中等宽度 Leftbar 后左对齐 Main、实际 Rail 轨道和移动端 Drawer 替换旧候选。
5. [x] 迁移 Blueprint、主工程配置、Collection/Page 示例、Reference 与核心知识库。
6. [x] 将 Appearance 收敛为最终视觉实现层：模板挂载 `.ui-surface/.ui-drawer-surface`，当前编译的 preset 直接实现表面、正文和现有组件语义类，移除根级 Appearance 参数表、PageViewModel/HTML preset 投影与构建期开关。
7. [x] 将 Leftbar 背景完整归属当前 Appearance：Flat/Minimal 透明、Card 使用 `var(--card)`、Glass 独立消费 `gradient/image` 配置并实现装饰层；通用 Sidebar 只保留结构、布局和滚动。
8. [x] 完成主题全仓检查、主工程生成和新的浏览器视口矩阵；已通过且未受本次布局改动影响的 Blueprint 集成门禁不重复运行。
9. [x] 将含糊的 `brand` 候选替换为 `site_brand` / `collection_brand`，以双来源 PageViewModel 和 Leftbar 固定槽位选择器支持站点与 Collection 身份同时出现；共享 partial 按 Leftbar Site、Leftbar Collection、Topbar 输出差异化外观，GitHub 数据只作为 Site Brand 的渲染期增强；图片保持静态，标语统一为字符串，图片与标题统一使用来源首页且不开放 URL 配置；Wiki 返回入口内聚到 Brand 顶部的通用 Navigation，不再注册 `wiki_home` Widget。
10. [x] 让 Topbar Viewport 填满实际内容高度，并让列表页 Navbar 在有 Topbar 时于该内容区垂直居中吸顶，以更高层级复用 Topbar 表面；仅在 pinned 状态去除 Navbar 自身容器视觉和施加居中位移，无 Topbar 路径保持不变。
11. [x] 让 Leftbar 绝对定位轨道从现有 `--leftbar-gap` 开始，统一 Hero 自然滚动与 Sticky 阶段的 Topbar 间距；保留 Surface 高度、Sticky offset 和 Drawer 显式顶部坐标。
12. [x] 让存在 Topbar 的 Shell 在正常文档流中消费现有 `--shell-topbar-top`，统一 Hero→Topbar 的自然滚动与 Sticky 顶部间距；Card 通栏及 Flat/Minimal 零间距语义保持不变。
13. [x] 将 769–1180px 的 Leftbar 从自动 Rail/临时 Drawer 改为常驻并直接消费持久化状态；Rightbar 继续进入 Drawer，Main 从 Leftbar 后开始且保留既有宽度上限。

## 约束

- 不提供运行时旧名称别名。
- 不新增依赖，不公开宽度、断点、Sticky offset 或动画时长。
- 不运行 `acceptance:prepare`，不更新 #720 候选，不推进 Alpha。
- 不提交、不推送、不发布。
