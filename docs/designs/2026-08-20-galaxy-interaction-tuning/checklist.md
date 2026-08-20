---
title: Wiki Galaxy 辉光与鼠标交互调整检查清单
date: 2026-08-20
---

# 检查清单 / 验证记录

- [x] `npm run lint` 通过。
- [x] `python3 docs/knowledge/tools/verify.py` 通过（行号异常 0、版本不一致 0）。
- [x] 主工程 `npm run g` 通过（252 个文件生成并完成 HTML/CSS/JS 压缩）。
- [x] `glowIntensity: 0.2`、`mouseRepulsion: true`、`repulsionStrength: 0.1`。
- [x] `autoCenterRepulsion` 保持 `0`，密度、速度、色相、闪烁与旋转参数未改动。
- [x] 鼠标坐标平滑、离开 Hero 后的交互强度淡出和 Canvas `pointer-events: none` 机制未改动。
- [ ] 视觉效果与鼠标排斥强度由用户预览验收。
