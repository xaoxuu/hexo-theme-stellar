---
title: Wiki Galaxy WebGL 背景检查清单
date: 2026-08-19
---

# 检查清单 / 验证记录

## 验证

- [ ] 主题仓库 `npm run check`（lint、135 项测试与知识库核查通过；最后的发版登记检查被当前 `main` 已有 6 个未登记提交拦截，与本次未提交改动无关）
- [x] 主工程 `npm run g`
- [x] Wiki Galaxy 桌面端与 390px 移动端静态生成及浏览器渲染正常
- [x] 星场密度、辉光、色彩、闪烁、纵深速度与旋转符合固定参数
- [x] 鼠标移动产生平滑视差且不排斥星点，离开 Hero 后视差淡出
- [x] Canvas 使用 `pointer-events: none`，源码按钮命中正常，不拦截 Hero 交互
- [x] Canvas 尺寸跟随 Hero；离开页面后无生命周期错误
- [x] 透明 Canvas 与自适应文字取色基准统一使用 `#000000`；失败路径保留同一静态底色
- [x] Galaxy 以外的普通 Wiki 页面不加载插件；静态图片与无背景分支未改动

## 文档同步

- [x] `docs/knowledge/` 与 `VERIFICATION.md` 已更新
- [x] 主站 `source/wiki/stellar/wiki-settings.md` 已更新并刷新 `updated`
- [x] React Bits MIT 第三方许可声明与 Galaxy 插件均进入 npm dry-run 包清单
