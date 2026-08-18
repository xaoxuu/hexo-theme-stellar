---
title: Wiki Hero 封面检查清单
date: 2026-08-18
---

# 检查清单 / 验证记录

## 验证

- [x] 主工程 `npm run g`
- [x] Wiki 首页及普通 Wiki 页面（静态生成）
- [x] `python3 docs/knowledge/tools/verify.py`（硬事实异常为 0）
- [x] Wiki Hero 顶部左侧为无背景站点标题按钮，链接至首页且文字颜色为 `--text-banner`
- [x] 最新版本标签边框为主题色的 50% 透明度，文字不受影响
- [x] 安装命令终端以 50% `--text-banner-theme`（无值回退 `--background`）混色及背景模糊显示
- [x] 终端工具栏和命令区分别使用 `--text-banner`、`--text-banner-theme`
- [x] “源码”按钮背景与边框使用 `--text-banner`，文字和图标反转同一变量
