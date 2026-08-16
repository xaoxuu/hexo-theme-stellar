---
title: README 重构执行计划
date: 2026-08-16
---

# 执行计划

## 实施步骤

1. [x] 重写 `README.md`（首屏「博客 + 知识库一体」一句话定位 + 轻量起步 + 四组特性 + 示例展示 + 快速开始 + 文档 + 反馈 + 许可）
2. [x] 新增 `README_EN.md`（完整翻译，同结构同链接，文档站注明为中文）
3. [x] 结合 https://xaoxuu.com/blog/20260815/ 复盘结论校准定位与卖点表述（一体化整合、避免功能数量堆砌）
4. [x] 新建 `docs/designs/2026-08-16-readme-refactor/`（spec.md / plan.md / checklist.md）
5. [x] 验证全部外链可达
6. [x] 运行 `python3 docs/knowledge/tools/verify.py` 回归
7. [x] 复核 GitHub 渲染

## 风险与回退

- GitHub 等外链可能受网络环境影响：失败时使用代理（端口 7890）复测。
- 英文翻译与中文版漂移：以中文版为权威，评审时逐节对照。
- 若知识库核查因无关原因失败：不修改知识库，报告并排查。
