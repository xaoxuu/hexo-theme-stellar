# Stellar 2.0.0-rc.3 发布候选核查

> 核查日期：2026-09-10
> 发布基线：`2.0.0-rc.2`
> 候选版本：`2.0.0-rc.3`

## 基线与审计方法

以公开 rc.2 tag 到 main 最终树的差异为准，沿默认配置、Schema、模型、模板、浏览器消费者和直接测试核对；不把已被最终树替换的中间方案写成兼容契约。开始发布准备时工作区干净，main 与 origin/main 一致。

## 净变化与文档覆盖

| 领域 | 最终行为与事实源 | 文档出口 |
| --- | --- | --- |
| 配置与资源 | `_config.yml`、配置 Schema、资源投影：sitemap、独立悬停开关、字体设置、第三方地址覆盖与 Artalk 配套资源 | 配置、排版、Extension、评论知识库及 CHANGELOG |
| 导航与生命周期 | `partial-navigation.js`、ExtensionRegistry：同集合签名匹配、页面卸载／挂载、历史恢复与整页回退 | 页面导航、Extension 知识库及 CHANGELOG |
| 图片 | `image-metadata.js`、CLI、图片过滤器与 runtime：增量持久缓存、尺寸与颜色、懒加载及错误占位 | 图片处理、性能知识库及 CHANGELOG |
| 内容与构建 | Collection Pipeline、models、PageViewModel registry：共享模型、构建隔离、Topic 分享、作者聚合、上下篇 | 内容 Schema、文章页脚、性能知识库及 CHANGELOG |
| 链接与搜索 | md_link、siteinfo、mdrender、comments、local-search：图标增强与分批结果 | 数据服务、搜索知识库及 CHANGELOG |
| 样式与媒体 | Stylus、模板、TOC、Reveal：外观、移动布局、图片比例及入场恢复 | CHANGELOG；具体视觉值不作为长期文档契约 |
| 工程 | package.json、包集成与性能检查：Sharp 依赖、资源统计与维护门禁收敛 | 安装、性能知识库；工程规范以 AGENTS.md 与 CI 为准 |

## 升级边界

rc.2 的页脚 sections 迁移为 sitemap，条目对象转为 Markdown 字符串；卡片悬停 enabled 迁移为 spotlight/tilt 两个开关。旧输入不双读、不自动转换，升级方法在 CHANGELOG 给出。新增导航与图片预处理默认启用，可分别关闭。Topic 分享继承全局，Wiki 与 Notebook 保持关闭默认。

## 验证

发布预演执行 `npm run release:dry -- 2.0.0-rc.3`，在目标版本文件写入后运行完整 `release:check`：lint、单元测试、复用、贡献描述符、四场景 npm tarball 安装与 Doctor／生成／压缩／Runtime ESM 保真、同运行时性能比较及知识库核查。预演完成后恢复受管版本文件；正式发布再次基于最终文件运行同一门禁。

本轮发布预演已通过：236 项单元测试、23 项 Contribution descriptor、四场景 npm tarball 安装与 Doctor／生成／HTTP 200／压缩／ESM 保真，以及性能资源对比和知识库检查。首次预演因本地缺少已声明的 Sharp 依赖中断，执行 npm ci 后原 7 项图片测试及完整预演均通过，无源码修补。性能报告为 comparisonOnly，不使用百分比降幅硬阈值。正式发布由 `npm run release -- 2.0.0-rc.3 --yes` 推送 main 与 npm，再核对 Actions、npm rc dist-tag、tag 与 GitHub Release。
