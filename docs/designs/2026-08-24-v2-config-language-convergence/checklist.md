---
title: Stellar v2 M6 配置、语言与内部常量收敛验收
date: 2026-08-24
status: 实施中
issue: 724
---

# 验收清单

## 契约

- [x] 当前 Theme、Collection 与 Front Matter 全部 Schema 字段都有唯一 disposition 与非空理由。
- [x] M6 退出字段仍进入审计，并明确为 `localize/internalize/remove`。
- [x] 公开 Reference 只保留真实用户选择；退出字段没有别名、兼容读取或静默 fallback。

## 语言

- [x] en / zh-CN / zh-TW 键结构一致。
- [x] copy、code-copy、AI 摘要与 OKR 内置状态默认文案来自语言文件。
- [x] 品牌、菜单、Footer、许可与用户自定义 Extension 文案仍由站点配置拥有。

## 内部常量

- [x] Extension 资源、唯一 provider、request/cache 策略和固定时序只有 `internal-constants.js` 一个权威入口。
- [x] Runtime Manifest 投影深度冻结的 policy/messages，浏览器不维护第二套默认值。
- [x] 配置、Collection 与 Front Matter 不出现内部 policy 或资源字段。

## 行为

- [x] `{% copy %}` 与 code-copy 的成功/失败提示按页面语言渲染。
- [x] AI 摘要缺省界面按页面语言渲染，显式站点覆盖仍优先。
- [x] OKR 内置状态按页面语言渲染，动态自定义状态 label 仍有效。
- [x] URL、DOM、CSS、视觉与客户端公共 API 不变。

## 验证

- [x] `npm run reference:check`
- [x] `npm run check`（Node.js 22.23.2，363 项测试，首屏核心 JS gzip 较 v1.44.0 降低 46.6093%）
- [x] `python3 docs/knowledge/tools/verify.py`
- [x] 主工程 `npm run g`（262 个生成文件）
- [ ] Standards / Spec 双轨 review 无剩余 finding
- [ ] `origin/v2` 包含 #724 提交，交付评论与 `resolved` 自动关闭完成

## N/A

- 公开 Wiki 产品叙事、v1 迁移、SEO 跳转：M6 不改变公开页面或索引路由。
- npm 发布、tag、主仓库子模块指针：留给后续发布切片。
- M7 Collection Pipeline、M8 贡献注册契约、M9 空配置：不提前实施。
