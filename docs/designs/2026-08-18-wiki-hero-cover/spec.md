---
title: Wiki Hero 封面方案
date: 2026-08-18
status: 已实施
---

# Wiki Hero 封面方案

## 目标

将 Wiki 项目首页从单列启动封面升级为双栏 Hero，支持可复用的项目动作、安装指令和产品预览。

## 技术方案

- 项目 YAML 的 `background` 取 URL 图片或 `galaxy` Canvas 背景。
- 静态图在底部 20% 使用同图模糊层与站点背景色渐隐，避免与正文突变。
- 复用 GitHub 数据服务的 tags 请求取得最新版本；终端切换与复制、星空背景由 `main.js` 按页面元素初始化。
- 顶部左侧导航改为无背景的站点标题按钮，使用 `config.title` 与 `--text-banner`，链接至站点首页；不再显示项目图标和项目名。
- 项目配置 `repo` 时，最新版本标签移动到站点标题右侧；导航项以 flex 布局排列，间距为 `1rem`。
- 最新版本标签的边框沿用 `--text-banner-theme`，以 50% 透明度显示，文字保持原有不透明度。
- 安装命令终端以封面平均色生成的 `--text-banner-theme` 与透明色各占 50% 的混色填充，并保留背景模糊；封面图的主题色因此成为毛玻璃底色，变量不可用时回退到 `--background`。
- 终端工具栏文字继承 `--text-banner`；下方命令及 `$` 提示符统一使用 `--text-banner-theme`。
- “源码”按钮背景使用 `--text-banner`；其文字与图标在各自前景层使用 `invert(1)`，确保深浅封面下文字始终为背景的反色。

## 影响范围

- `layout/_partial/cover/wiki_cover.ejs`
- `source/css/_components/partial/cover.styl`
- `source/js/main.js`、`source/js/services/ghinfo.js`
- Wiki 使用文档与知识库。
