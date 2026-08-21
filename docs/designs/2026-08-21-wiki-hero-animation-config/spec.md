---
title: Wiki Hero 动画独立配置
date: 2026-08-21
status: 已实施
---

# Wiki Hero 动画独立配置

## 1. 问题与目标

- Wiki Hero 当前以 `background: galaxy` 同时选择动态效果和静态底色，无法与图片背景组合，也无法调整 Galaxy 参数。
- 将 `background` 收敛为静态图片字段，新增 `animation.type` 和 `animation.params`；首期只支持 `galaxy`。
- 图片与 Galaxy 可独立或组合使用；组合时透明 Canvas 覆盖图片，文字继续按图片平均色自适应。
- 移除 `background: galaxy` 旧写法，不提供兼容分支。

## 2. 技术方案

- `layout/_partial/cover/wiki_cover.ejs` 分别解析 `background` 与 `animation`，仅 `animation.type: galaxy` 输出 Canvas，并以转义后的 JSON data attribute 传递参数。
- `source/js/plugins/galaxy.js` 保留现有 WebGL 着色器与生命周期，在每次挂载时独立规范化参数并写入 uniforms；缺失或非法值逐项回退默认值，未知参数忽略。
- `source/css/_components/partial/cover.styl` 明确图片、模糊层、Canvas 和渐隐层的叠放顺序；仅 Galaxy 时使用黑色静态底色，图片与动画组合时动画失败仍保留图片。
- 复用现有 Wiki Hero partial、按需脚本加载、文字自适应插件和 WebGL 生命周期，不新增依赖、公共服务或国际化文案。

## 3. 配置契约与边界

- `animation.params` 使用 camelCase，支持 `focal`、`rotation`、`starSpeed`、`density`、`hueShift`、`speed`、`glowIntensity`、`saturation`、`mouseRepulsion`、`twinkleIntensity`、`rotationSpeed`、`repulsionStrength`、`autoCenterRepulsion`、`transparent`。
- `focal` 为两个 `0–1` 数值；`rotation` 为两个有限数值；`hueShift` 归一化到 `0–360`；速度、密度和强度为非负有限数值；`rotationSpeed` 接受有符号有限数值；布尔项只接受布尔值。
- `transparent: false` 允许不透明 Canvas 覆盖图片，这是显式配置的预期结果。
- 未知 `animation.type`、减少动态效果偏好、WebGL/着色器/脚本失败时不创建动态效果，背景与 Hero 内容保持可用。

## 4. 影响范围

- 模板、Wiki Hero 样式、Galaxy 客户端脚本与测试。
- 主题知识库 `03-内容系统/wiki-docs.md` 和 `VERIFICATION.md`。
- 主站 Wiki 项目 YAML、Stellar 使用文档以及主工程 spec。

## 5. 验证方式

- 客户端测试覆盖默认值、逐项覆盖、类型与范围校验、色相归一化和多 Canvas 独立配置。
- 标记测试覆盖背景与动画独立判断、参数安全序列化和旧写法不再触发 Canvas。
- 执行主题 `npm run check`、主工程 `npm run g`，并核对仅图片、仅 Galaxy、图片叠加 Galaxy 和失败降级。
