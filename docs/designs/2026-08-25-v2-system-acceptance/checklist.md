---
title: Stellar v2 M10 全系统回归检查清单
status: 等待站长重新验收
---

## 自动矩阵

- [x] 默认空配置、三套 Blueprint、三种语言与四类 Collection 通过真实 tarball。
- [x] init dry-run/真实计划一致、整体冲突拒绝、失败回滚和用户文件保护通过。
- [x] doctor text/json、new note、generate、Reference、Runtime Manifest、搜索索引和主要路由通过。
- [x] 旁路迁移与原地迁移 fixture 通过，正文哈希保持不变。
- [x] 内置 Blueprint manifest 仍只服务主题资产、Reference 与初始化。
- [x] 隔离站点安装固定 `hexo-server`，六个站点逐一启动并由本机 HTTP 请求验证首页 200 与 Stellar Shell。
- [x] npm `latest` 仅在 SemVer 严格较新时提示升级，v2 候选不再反向提示安装 v1。
- [x] 共享 Feature adapter 的 `deferred-icons`、`dropdown` 与 `swiper` 均携带自身分派 ID；文章列表日历 SVG 被替换且不再拉伸 meta。
- [x] 本地预览控制台不再报告 `unknown built-in feature undefined`。

## 固定人工验收包

- [x] 候选包哈希、环境、矩阵结果、站点路径和待测 URL 已写入报告。
- [x] 桌面/移动端、主要布局、导航、搜索、评论降级、SEO 与三种语言场景已列出。
- [x] 问题记录模板包含环境、URL、预期、实际、截图/日志和结论。

## 门禁

- [x] `npm run check`
- [x] `npm run integration:check`
- [x] `npm run performance:check`
- [x] `npm pack --dry-run --json`
- [x] 主工程 `npm run g`
- [x] Standards / Spec 复审无剩余 finding

## 状态与发布边界

- [x] 主题提交已推送到 `origin/v2`，#720 已收到自动证据评论。
- [x] #720 保持 open 且未添加 `resolved`，状态为“等待站长人工验收”。
- [x] 未发布 npm，未创建 tag/Release，未更新主仓库子模块指针。
- [x] Alpha 内部里程碑仍等待站长明确结论。
