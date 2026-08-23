---
title: 安装与启动
domain: 总览与安装配置
tags:
  - 安装
  - npm
  - 环境要求
---

# 安装与启动

<details>
<summary>相关源码文件</summary>

生成此页面时参考的主题源码文件：

- [.github/workflows/npm-publish.yml](../../../.github/workflows/npm-publish.yml)
- [.npmignore](../../../.npmignore)
- [LICENSE](../../../LICENSE)
- [README.md](../../../README.md)
- [_config.yml](../../../_config.yml)
- [blueprints/](../../../blueprints/)
- [package.json](../../../package.json)
- [scripts/commands/stellar.js](../../../scripts/commands/stellar.js)

</details>

本文介绍 Stellar Hexo 主题的安装过程，包括环境要求、依赖安装与首次启用。重点是让主题文件进入你的 Hexo 项目并完成首次启用。

详细配置见[配置系统](configuration.md)，样式与主题定制见[样式系统](../01-样式系统/styling-overview.md)。

---

## 目的与范围

本文说明如何：

- 确认开发环境满足 Stellar 的要求
- 通过 npm 安装主题包
- 在 Hexo 配置中启用主题
- 理解主题的依赖结构
- 验证安装是否成功

本文**不**涉及内容创作、高级配置或具体功能设置，这些内容见后续章节。

---

## 环境要求

Stellar 面向现代 Hexo 环境构建，需要兼容的 Node.js 版本。

### 版本要求

| 组件 | 版本要求 | 说明 |
|------|----------|------|
| **Hexo** | 6.3.0 ~ latest（已验证至 8.1.2） | 核心静态站点生成器 |
| **hexo-cli** | 4.3.0 ~ latest | 命令行工具 |
| **Node.js** | >= 22 | 建议选择 LTS 版本 |
| **npm** | 随 Node.js 安装 | 包管理器 |

**重要**：请选择 Node.js LTS（长期支持）版本，过新的非 LTS 版本可能与 Hexo 生态兼容性不佳。

### 验证命令

```bash
# 检查已安装版本
hexo version
node --version
npm --version
```

**参考源码**：[README.md](../../../README.md)

---

## 安装方式

Stellar 以 npm 包形式分发，安装到 Hexo 项目的 `node_modules` 目录，遵循标准 Hexo 主题安装模式。

### 安装流程

```mermaid
graph TB
    START["User initiates installation"]
    CHECK["Verify Hexo project exists"]
    NPM["Execute: npm i hexo-theme-stellar"]
    DOWNLOAD["npm downloads package from registry"]
    EXTRACT["Extract theme files to node_modules/hexo-theme-stellar/"]
    DEPS["Install theme dependencies"]
    COMPLETE["Installation complete"]
    
    START --> CHECK
    CHECK -->|Project exists| NPM
    CHECK -->|No project| ERROR["Error: Run hexo init first"]
    NPM --> DOWNLOAD
    DOWNLOAD --> EXTRACT
    EXTRACT --> DEPS
    DEPS --> COMPLETE
```

### 安装命令

在 Hexo 项目根目录执行：

```bash
npm i hexo-theme-stellar
```

该命令会：

1. 从 npm registry 下载主题包
2. 安装到 `node_modules/hexo-theme-stellar/`
3. 自动安装 `package.json` 中声明的全部依赖
4. 使主题对 Hexo 可用

**参考源码**：[README.md](../../../README.md)、[package.json](../../../package.json)

---

## 主题包结构

`package.json` 定义了主题的身份、依赖与元数据，理解它有助于排查安装问题。

### 包元数据

```mermaid
graph LR
    PKG["package.json"]
    META["Metadata"]
    DEPS["Dependencies"]
    REPO["Repository Links"]
    
    PKG --> META
    PKG --> DEPS
    PKG --> REPO
    
    META --> NAME["name: hexo-theme-stellar"]
    META --> VER["version: 1.44.0"]
    META --> DESC["description: Elegant and powerful theme"]
    
    DEPS --> CHEERIO["cheerio: ^1.1.0"]
    DEPS --> GLOB["glob: ^10.4.0"]
    DEPS --> EJS["hexo-renderer-ejs: ^2.0.0"]
    DEPS --> STYLUS["hexo-renderer-stylus: ^3.0.1"]
    DEPS --> PROBE["probe-image-size: ^7.2.3"]
    
    REPO --> GIT["GitHub repository"]
    REPO --> ISSUES["Issue tracker"]
    REPO --> HOME["Homepage/docs"]
```

### 核心依赖

主题依赖以下包，安装时会自动装入：

| 依赖 | 版本 | 用途 |
|------|------|------|
| **cheerio** | ^1.1.0 | HTML/XML 解析与操作（内容处理） |
| **glob** | ^10.4.0 | 文件通配匹配 |
| **hexo-renderer-ejs** | ^2.0.0 | EJS 模板渲染引擎（渲染布局文件） |
| **hexo-renderer-stylus** | ^3.0.1 | Stylus CSS 预处理器（编译主题样式） |
| **js-yaml** | ^4.1.0 | Blueprint manifest、生成配置与 doctor 的 YAML 读取 |
| **probe-image-size** | ^7.2.3 | 图片尺寸探测（懒加载占位） |

这些依赖分别负责：

- **cheerio**：标签插件与辅助函数中的 DOM 操作
- **glob**：脚本中的文件批量匹配
- **hexo-renderer-ejs**：渲染 `.ejs` 布局模板
- **hexo-renderer-stylus**：把 `.styl` 编译为 CSS
- **js-yaml**：读取 Blueprint 资产和 doctor 检查的站点配置，不负责自动改写
- **probe-image-size**：无需下载完整图片即可获取图片尺寸

**参考源码**：[package.json](../../../package.json)

---

## 主题启用

安装完成后，必须显式在 Hexo 站点配置中启用主题，Hexo 不会自动切换到新安装的主题。

### 启用流程

```mermaid
graph TD
    INSTALL["Theme installed in node_modules/"]
    CONFIG["Edit _config.yml<br/>(site root)"]
    SETTHEME["Set theme: stellar"]
    HEXO_READS["Hexo reads configuration"]
    LOOKUP["Hexo looks for theme in:<br/>1. themes/stellar/<br/>2. node_modules/hexo-theme-stellar/"]
    FOUND["Theme found in node_modules/"]
    LOADS["Hexo loads theme files"]
    READY["Theme active"]
    
    INSTALL --> CONFIG
    CONFIG --> SETTHEME
    SETTHEME --> HEXO_READS
    HEXO_READS --> LOOKUP
    LOOKUP --> FOUND
    FOUND --> LOADS
    LOADS --> READY
```

### 修改配置

打开 Hexo 站点根目录的 `_config.yml`（不是主题的 `_config.yml`），设置：

```yaml
theme: stellar
```

这一行告诉 Hexo 使用 Stellar 主题。如果主题不在传统的 `themes/` 目录，Hexo 会自动在 `node_modules/hexo-theme-stellar/` 中查找。

**参考源码**：[README.md](../../../README.md)

---

## v2 Blueprint 初始化与检查

Pre-alpha M3 提供三套一次性 Blueprint：`classic-blog`、`minimal-reading`、`docs-reference`，以及 `stellar`、`minimal` 两套 Visual Style。主题启用后可以先预览写入计划：

```bash
npx hexo stellar init --blueprint classic-blog --style stellar --dry-run --non-interactive
```

确认目标文件均可创建后，移除 `--dry-run` 执行写入。init 会整体拒绝任何已有目标，不覆盖或合并用户文件。生成结果是普通 `_config.stellar.yml`、Collection 数据与 Markdown 内容；其中没有 Blueprint ID、锁文件或运行时继承关系。

生成后运行只读检查：

```bash
npx hexo stellar doctor --format text
npx hexo stellar doctor --format json --silent
```

JSON 模式必须使用 Hexo 全局 `--silent`，避免命令加载前的 Hexo 启动日志混入标准输出，保证 stdout 是可直接解析的单一 JSON 文档。doctor 检查 Node.js、Hexo、`theme: stellar`、主题配置、Collection YAML 与 Markdown Front Matter；失败问题包含来源、字段路径、实际类型、期望结构和迁移章节，但不会修改文件。

**参考源码**：[blueprints/](../../../blueprints/)、[scripts/commands/stellar.js](../../../scripts/commands/stellar.js)、[scripts/lib/blueprints/](../../../scripts/lib/blueprints/)、[scripts/lib/doctor.js](../../../scripts/lib/doctor.js)

---

## 主题配置文件

Stellar 自带一份覆盖全部主题功能的配置文件，位于主题包内，是主题功能的集中控制点。

### 配置文件位置

```
node_modules/hexo-theme-stellar/_config.yml
```

该文件按主题域分成若干小节，主要小节如下：

| 小节 | 用途 |
|------|------|
| `site` | Brand、菜单与 Footer 站点外壳 |
| `seo` | canonical、Open Graph 与结构化数据 |
| `layout` | 页面 Profile：路径、导航与左右侧栏 |
| `content` | Article 与 Notebook 内容默认值 |
| `appearance` | 排版、颜色、形状、动效和背景 |
| `resources` | preconnect 与按角色命名的资源兜底 |
| `extensions` | 搜索、评论、标签、Feature、服务与缓存 |
| `inject` | 站点 `_config.stellar.yml` 与页面 Front Matter 的受信任原文注入 |

### 主题元数据

主题版本、主页与仓库地址来自 `package.json`，核心 CSS/JS 路径来自内部资源清单。它们不是站点配置项，v2 不允许在 `_config.stellar.yml` 中覆盖。

**参考源码**：[package.json](../../../package.json)、[scripts/lib/theme-metadata.js](../../../scripts/lib/theme-metadata.js)

---

## 安装后的目录结构

安装成功后，项目结构包含：

```
your-hexo-site/
├── _config.yml                          # 站点配置（theme: stellar）
├── package.json                         # 站点依赖
├── node_modules/
│   └── hexo-theme-stellar/              # 主题包
│       ├── _config.yml                  # 主题配置
│       ├── package.json                 # 主题包定义
│       ├── layout/                      # EJS 模板
│       ├── source/                      # CSS/JS/图片
│       │   ├── css/
│       │   └── js/
│       ├── scripts/                     # Hexo 脚本（helpers、标签插件）
│       └── languages/                   # i18n 文件
└── source/                              # 你的内容
```

主题完全从 `node_modules/hexo-theme-stellar/` 运行，Hexo 会自动发现并加载该位置的全部主题组件。

**参考源码**：[package.json](../../../package.json)

---

## 验证步骤

安装并启用后，验证主题是否正常工作。

### 验证清单

```mermaid
graph TD
    START["Installation complete"]
    
    GEN["Run: hexo generate"]
    CHECK_GEN{Generation<br/>successful?}
    
    SERVER["Run: hexo server"]
    CHECK_SERVER{Server<br/>starts?}
    
    BROWSER["Open: http://localhost:4000"]
    CHECK_RENDER{Pages render<br/>correctly?}
    
    SUCCESS["Installation verified"]
    
    ERROR_GEN["Check for missing dependencies"]
    ERROR_SERVER["Check port 4000 availability"]
    ERROR_RENDER["Check _config.yml syntax"]
    
    START --> GEN
    GEN --> CHECK_GEN
    CHECK_GEN -->|Yes| SERVER
    CHECK_GEN -->|No| ERROR_GEN
    
    SERVER --> CHECK_SERVER
    CHECK_SERVER -->|Yes| BROWSER
    CHECK_SERVER -->|No| ERROR_SERVER
    
    BROWSER --> CHECK_RENDER
    CHECK_RENDER -->|Yes| SUCCESS
    CHECK_RENDER -->|No| ERROR_RENDER
```

### 要执行的命令

1. **生成静态文件**：
   ```bash
   hexo generate
   ```
   用 Stellar 主题编译你的内容，确认无报错。

2. **启动开发服务器**：
   ```bash
   hexo server
   ```
   在 `http://localhost:4000` 启动本地服务。

3. **浏览器访问**：
   打开 `http://localhost:4000`，检查：
   - 页面是否带 Stellar 样式渲染
   - 导航元素是否出现
   - 浏览器开发者工具控制台无报错

### 常见安装问题

| 问题 | 原因 | 解决 |
|------|------|------|
| `Cannot find module 'hexo-theme-stellar'` | 主题未安装 | 执行 `npm i hexo-theme-stellar` |
| `hexo-renderer-ejs not found` | 缺少渲染器 | 应自动安装；可手动 `npm i hexo-renderer-ejs` |
| `hexo-renderer-stylus not found` | 缺少渲染器 | 应自动安装；可手动 `npm i hexo-renderer-stylus` |
| 页面显示 Hexo 默认主题 | 主题未启用 | 修改 `_config.yml`，设置 `theme: stellar` |
| CSS 未加载 | 资源路径错误 | 主题资源应自动从 `node_modules/` 加载 |

**参考源码**：[README.md](../../../README.md)、[package.json](../../../package.json)

---

## 版本管理

主题采用语义化版本，版本信息由 `package.json` 唯一维护。

### 版本位置

```mermaid
graph LR
    VER["Version: 1.44.0"]
    
    PKG["package.json"]
    VER --> PKG
    PKG --> NPM["npm registry"]
    PKG --> FOOTER["stellar_info() / Footer"]
    PKG --> DOCS["Documentation links"]
```

- **package.json**：`"version": "1.44.0"`，供 npm 分发使用

版本号遵循 `MAJOR.MINOR.PATCH` 格式；发版脚本同步 package 版本到安装知识库，不再修改主题配置。

### 更新主题

```bash
npm update hexo-theme-stellar
```

或指定版本：

```bash
npm install hexo-theme-stellar@1.44.0
```

更新后请重新生成站点：

```bash
hexo clean
hexo generate
```

**参考源码**：[package.json](../../../package.json)、[release.js](../../../release.js)、[.github/workflows/npm-publish.yml](../../../.github/workflows/npm-publish.yml)

---

## 下一步

安装成功后：

1. **配置主题**：见[配置系统](configuration.md)，全面了解 `_config.yml` 选项
2. **搭建内容类型**：见[内容系统](../03-内容系统/content-overview.md)，了解博客、wiki、笔记本系统
3. **定制样式**：见[样式系统](../01-样式系统/styling-overview.md)的设计令牌配置
4. **启用插件**：见[插件系统](../07-外部集成/plugin-system.md)，了解 fancybox、mermaid、katex 等可选功能

主题现在已按默认设置可用。所有功能都可以通过配置文件启用和定制，无需修改主题源码。

**参考源码**：[README.md](../../../README.md)、[_config.yml](../../../_config.yml)
