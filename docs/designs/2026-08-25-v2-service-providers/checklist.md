---
title: v2 第三方服务 Provider 契约验收
date: 2026-08-25
---

# 验收清单

- [x] 五类服务使用 `provider + providers` 且 Schema/Reference/doctor 一致。
- [x] 统一解析接缝已接管全部消费方，未选参数袋不被读取或投影。
- [x] 默认、自定义、关闭、未知 provider、旧字段与输出回归测试通过。
- [x] 主题知识库、总蓝图、主工程覆盖和公开 Wiki 已同步。
- [x] `npm run check`、`npm run integration:check` 与主工程 `npm run g` 通过。
- [x] 页面类型已覆盖：Post/Topic/Wiki/Notebook 的 contributors ViewModel 与 Footer、Wiki/普通页面的 Site Info Runtime Manifest，以及 Rating/Vote/GitHub Card/Sites/Link 标签输出均由单测或主工程构建验证。
- [x] #732 已从既有配置可发现性与文档改动中按补丁隔离；Standards / Spec 双轴复审无剩余 finding。
