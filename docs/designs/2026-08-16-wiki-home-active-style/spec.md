---
title: wiki 内页左上角返回按钮背景复用目录树激活样式
date: 2026-08-16
status: 已实施
---

# wiki 内页左上角返回按钮背景复用目录树激活样式 方案

## 1. 问题与目标

- wiki 内容页左侧边栏顶部的「所有项目」返回胶囊 `.wiki-home` 默认背景为纯色 `var(--bg-a50)`，而下方目录树激活项使用 `sidebar-light()`（顶部白色光照渐变 + 高光边），两者视觉不一致。
- 成功标准：返回胶囊默认背景与目录树激活项一致（`sidebar-light()`），图标与文字配色不变；glass / card 两种左栏风格下均自动跟随目录树激活项表现。

## 2. 技术方案

- `source/css/_components/sidebar/logo.styl`：`.wiki-home` 基础 `background: var(--bg-a50)` 替换为 `sidebar-light()`，与 `widgets/list.styl` 中 `.l_left .widget-wrapper.post-list .widget-body a.active` 使用同一混入；`:hover` 保留 `color: var(--text-p1)` 与 `sidebar-light()`（与基础态计算值一致，无额外效果）。
- `sidebar-light()` 读取容器级变量 `--leftbar-item-bg` / `--leftbar-item-shadow`，glass 风格为玻璃质感光照，card 风格（`.l_left.leftbar-card`）自动覆盖为 `var(--block-border)` / `none`，与目录树激活项保持一致。

## 3. 影响范围

- 主题样式文件：`source/css/_components/sidebar/logo.styl`（仅改默认背景，不动布局、间距、圆角、链接目标与 `wiki_home` 开关行为）。
- 知识库：`docs/knowledge/02-布局系统/sidebar-system.md` 交互样式段落补充返回胶囊默认态说明；同步合并版 `docs/knowledge/知识库全量.md`；`docs/knowledge/VERIFICATION.md` 登记本次变更。
- 主仓库 `source/wiki/stellar/` 无描述该胶囊默认背景的文档，无需改动；主仓库提交仅记录子模块指针。

## 4. 验证方式

- 单文件 CSS 改动、无 `scripts/` 变更，按 skill 不强制构建自检；按需主工程 `npm run s` 预览 glass / card、浅色 / 深色、移动端下 wiki 内容页左栏表现。
- `python3 docs/knowledge/tools/verify.py` 知识库硬事实核查。
