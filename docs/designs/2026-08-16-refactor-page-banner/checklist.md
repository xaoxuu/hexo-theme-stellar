# 验证记录

## 2026-08-16 实施验证

| 项目 | 结果 |
|------|------|
| `npm run g` 全量构建（hexo clean + generate + gulp minify） | ✅ 通过（247 文件生成，minify 无错误） |
| tech 文章（banner_info.color，行 1 无右侧） | ✅ `.top-row` 仅 `.left`（宽度 408px），`.meta-row` 紧随，`.bottom.only-title` 不变 |
| story 文章（行 1 右侧 AI 标签/阅读时长） | ✅ `.right` 贴右（x=634，右缘 720≈内容右缘），含 `ai-label`，无 `cap right` hack；`.bottom.only-title` 居中规则未动 |
| about（story + banner_info 头像，底部不居中） | ✅ `.right` 不渲染，`.bottom` 头像 + title/subtitle 原样式，无居中类 |
| wiki 页（行 2 仅更新日期） | ✅ `.meta-row` 内 `#post-meta` 仅“更新于” |
| note 页 | ✅ 结构与 wiki 一致，面包屑/日期正常 |
| 作者归档（无 `.top`、底部原样） | ✅ 不再输出空 `.top`，`.bottom` 头像 + title/subtitle 原样 |
| 普通 page | ✅ 无 banner 页面行为不变（如 privacy） |
| 布局几何（headless Chrome + CDP） | ✅ `.top` column + `flex-start`；`.top-row` row + `space-between`；行 1 y=32、行 2 y=53 紧密堆叠；`.left` 靠左、`.right` 靠右；`.bottom` 位于下块 |
| 编译 CSS | ✅ `.top-row` / `.right` / `.meta-row` 已产出；`.reading.right` / `.ai-label.right` / `margin-left:auto` hack 已移除 |
| `python3 docs/knowledge/tools/verify.py` | ✅ 退出码 0，行号异常 0、版本不一致 0（55 未解析/9 配置键为既有报告，非本次引入） |

## 结论

- 上块显式两行结构落地，右对齐不再依赖 hack；`breadcrumb: false` 场景不再输出空 `.top`。
- 下块（标题对齐规则、banner_info 样式）零改动，行为与视觉保持一致。
- 保留 `.banner` 共享基类，页面级类名未变。

## 修复记录（2026-08-16 复审）

- 发现回归：移除空 `.top` 后，作者归档页 `.bottom` 因 `space-between` 对唯一子元素不生效而顶到横幅顶部。
- 修复：`.article.banner .content .bottom` 增加 `margin-top: auto`，`.bottom` 恒贴底；有 `.top` 页面位置与修复前一致。
- 复测：author `.bottom` 底边与 `.content` 底边对齐（y=115/216）；story/tech/about/wiki `.bottom` 坐标与修复前一致。
