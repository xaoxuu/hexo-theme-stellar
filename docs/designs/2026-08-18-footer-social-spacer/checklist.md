---
title: Footer Social 弹性占位项检查清单
date: 2026-08-18
---

# 检查清单 / 验证记录

## 验证

- [x] 普通 social 条目保持原有渲染和尺寸
- [x] `spacer` 不输出交互元素，且将后续按钮推至右侧
- [x] dropdown 与 spacer 组合时保持原有交互
- [x] 主工程 `npm run g` 通过
- [x] `python3 docs/knowledge/tools/verify.py` 通过

验证结果：

- 使用临时配置渲染 `github → spacer → dropdown`，首页 HTML 包含 `<span class="social-spacer" aria-hidden="true">`，生成的 CSS 包含 `flex: 1 1 0`；临时配置已还原。
- `npm run g` 于 2026-08-18 22:13 通过。
- 知识库核查通过；仍报告仓库既有的 54 个未解析引用和 11 个配置键提示，本次未新增异常。

## 文档同步

- [x] 默认配置示例已更新
- [x] 主题知识库和 `VERIFICATION.md` 已更新
- [x] 主工程 Stellar Wiki 已更新
