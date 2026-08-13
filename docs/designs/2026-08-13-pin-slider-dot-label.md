---
title: 移除置顶轮播圆点按钮 aria-label
date: 2026-08-13
status: 已实施
---

# 移除置顶轮播圆点按钮 aria-label 方案

## 1. 问题与目标

置顶内容轮播的圆点按钮通过 `aria-label="<文章标题>"` 提供无障碍名称，但标题未经 HTML 转义直接拼入属性：当置顶文章标题含英文/中文引号（如《通勤最后 10 分钟的"减速"技巧》）时，引号提前截断属性，产出畸形 HTML，`hexo-minify`（after_render:html 阶段的 html-minifier）解析失败，Hexo 报 `Render HTML failed: archives/index.html`。

目标：移除圆点按钮的 `aria-label` 属性（最小修复，不做全量转义），构建不再因标题引号失败；圆点点击切换与激活态标记保持不变。

## 2. 技术方案

- 在 `layout/_partial/main/pin_slider.ejs` 中删除 `aria-label="..."` 拼接与不再使用的 `label` 取值逻辑；圆点按钮保留 `type="button"`、`class`、`data-index`，激活态继续由脚本切换 `aria-current`。
- 不涉及样式与配置改动。

涉及文件：

- `layout/_partial/main/pin_slider.ejs`
- `docs/knowledge/05-前端交互/client-side-overview.md`、`docs/knowledge/知识库全量.md`、`docs/knowledge/VERIFICATION.md`

## 3. 影响范围

- 对外行为：置顶轮播圆点按钮不再提供基于标题的无障碍名称（屏幕阅读器仅读到无名称按钮与 `aria-current` 状态）；其余交互（自动播放、圆点点击、翻页按钮、触摸滑动、hover/focus 暂停）保持不变。
- 兼容性：无配置项变更；已知残余风险——`pin_slider.ejs` 中其余用户内容（幻灯片标题/摘要/封面 URL/wiki 字段）仍未转义，标题含 `<`、`&` 或封面 URL 带引号时可能触发同类问题，留作后续加固任务。

## 4. 验证方式

- 知识库有改动，运行 `python3 docs/knowledge/tools/verify.py`；整体跑 `npm run check`。
- 复现验证：在主工程 xaoxuu.com 临时新增带 `pin: 1`、标题含引号的草稿，执行 `npm run g`，确认 `archives/index.html` 正常生成；随后删除临时草稿并 `hexo clean`。
