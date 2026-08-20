---
title: 全局卡片 Hover 光效与倾斜执行计划
date: 2026-08-20
---

# 执行计划

1. [x] 增加插件配置、条件加载 partial、客户端脚本与末尾覆盖样式。
2. [x] 为目标模板、link/grid 标签与标准 UI Collection 条目增加组合类，不修改 adapter 等排除组件。
3. [x] 补充 link/grid/dropdown/collection 标记渲染与客户端生命周期测试。
4. [x] 同步知识库、主仓库 Wiki 与 `VERIFICATION.md`。
5. [x] 执行检查、构建和页面交互验证。
6. [x] 修复 Spotlight 离开时先回中再淡出的闪动，并补焦点、快速重入与销毁回归测试。
7. [x] 为置顶轮播外层和专栏最新文章卡片接入 Spotlight + Tilt，并保留轮播轨道与专栏归档列表的原有边界。

## 风险与回退

- 插件样式只对完成挂载的 `.card-hover.is-card-hover-ready` 生效，脚本失败时保持原样。
- Tilt 作用于卡片本体，避免与 ScrollReveal 包装器的行内 transform 冲突。
- 非精细指针和减少动态效果模式不挂载动态能力。
