---
title: 侧边栏艺术渐变背景检查清单
date: 2026-08-25
---

# 检查清单 / 验证记录

## 验证

- [x] `npm run schema:generate` 与 `npm run schema:check` 通过
- [x] Schema/Appearance 定向单测通过
- [x] 桌面 / 移动端浅色 / 深色本地视觉抽查通过
- [x] `python3 docs/knowledge/tools/verify.py` 通过
- [x] 不支持渐变时存在基础色回退，Card 表面保持不变
- [x] 移动端暗色覆盖不重复写入 inset，最终保持 `--inset: 0` 与既有裁剪

## 文档同步

- [x] Schema、Reference、字段审计与默认 YAML 一致
- [x] 侧边栏、深色模式与设计令牌知识库已更新
- [x] `docs/knowledge/VERIFICATION.md` 已登记
- [x] 公开 Wiki 的配置、默认值、顺序和降级说明与实现一致
- [x] 最终功能 diff 已完成文档同步核验

## 视觉校准（2026-08-26）

- [x] 推荐色相与线上旧版默认图片的冷灰、青蓝、珊瑚、砂金关系一致
- [x] 三层渐变使用独立尺寸，光晕范围较初版收窄
- [x] CSS 编译断言覆盖三层尺寸与定位
- [x] 定向 CSS 编译断言通过

## 双调色板契约（2026-08-26）

- [x] `type` 只接受 `gradient` / `image` / `color`，`gradient.light/dark` 各接受四个合法 CSS 颜色
- [x] 浅暗模式独立消费显式调色板，样式层不推导 HSL 通道
- [x] 渐变不叠加图片专用饱和度滤镜，图片行为保持不变
- [x] Schema、Reference、字段审计、知识库和公开 Wiki 已同步

## 默认观感校准（2026-08-26）

- [x] 默认为 `surface: glass`、留空的 `image:` 和两套显式 HSL 调色板
- [x] 默认为 `opacity: 1`、`radius: 100px`、`overlay: var(--bg-a50)`
- [x] 本次只执行 F1，未运行全仓、tarball 集成、M10、人工验收包或主工程全量构建

## 显式背景类型（2026-08-26）

- [x] 默认 `type: gradient`，图片与纯色需分别显式选择 `image` / `color`
- [x] `type: image` 在默认渐变列表非空时仍稳定输出图片
- [x] 移除 `gradient: []` 隐式开关与分支降级
