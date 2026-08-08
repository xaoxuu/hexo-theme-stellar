# Stellar Theme Development

这是 Hexo 主题 **Stellar** 的仓库。主题是一个独立的 npm 包，用于 [hexo-theme-stellar](https://github.com/xaoxuu/hexo-theme-stellar)。

## 技术栈

| 层级 | 技术 | 目录 |
|------|------|------|
| 模板引擎 | EJS | `layout/` |
| CSS 预处理 | Stylus | `source/css/` |
| 服务端 JS | CommonJS (ES5) | `scripts/` |
| 浏览器 JS | ES5 (Babel 转译) | `source/js/` |
| 国际化 | YAML | `languages/` |
| 文档 | Markdown | `docs/` |

## 目录结构

```
layout/                     # EJS 模板
├── _partial/               #   可复用组件
│   ├── main/               #     文章列表、导航、页脚
│   ├── sidebar/            #     侧栏组件
│   ├── cover/              #     封面
│   ├── comments/           #     评论系统
│   ├── widgets/            #     小部件
│   └── scripts/            #     脚本注入
├── _plugins/               #   可选插件片段
├── layout.ejs              #   根布局
├── index.ejs               #   首页
├── page.ejs                #   通用页面
└── archive.ejs             #   归档页
scripts/                    # Hexo 服务端脚本
├── tags/                   #   自定义标签 `{% tag %}`
│   └── lib/                #     标签实现
├── helpers/                #   EJS 辅助函数
├── filters/                #   Hexo 过滤器
├── generators/             #   页面生成器
├── events/                 #   事件处理
└── commands/               #   CLI 命令
source/                     # 浏览器端资源
├── css/                    #   Stylus 样式
│   ├── _defines/           #     变量和函数
│   ├── _common/            #     通用基础样式
│   ├── _components/        #     组件样式
│   └── _plugins/           #     插件样式
└── js/                     #   浏览器 JavaScript
    ├── plugins/            #     交互插件
    ├── services/           #     数据服务
    └── search/             #     搜索
```

## EJS 模板规范

- `<% %>` 逻辑控制，`<%- %>` 输出非转义 HTML
- 变量声明用 `var`（IE8 兼容）
- 2 空格缩进，HTML 属性双引号
- 可复用片段提取到 `_partial/`
- 复杂逻辑提取到 `helpers/` 辅助函数

```ejs
<%
var items = site.posts.sort('date', -1).limit(10)
items.forEach(function(post) {
%>
  <article>
    <%- partial('_partial/main/post_list/post_card', {post: post}) %>
  </article>
<%
})
%>
```

## Node.js 脚本规范

- CommonJS: `require()` / `module.exports`
- 文件头: `/* global hexo */` + `'use strict';`
- 2 空格缩进，双引号，分号结尾
- 标签注册: `hexo.extend.tag.register(name, handler, options)`
- 辅助函数注册: `hexo.extend.helper.register(name, handler)`

```js
/* global hexo */
'use strict';

module.exports = function(hexo) {
  return function(args, content) {
    var result = '';
    // ...
    return result;
  };
};
```

## Stylus 样式规范

- 文件引入顺序: `const` → `custom` → `theme_base` → `theme_colorful` → `func`
- 类名和文件名: `kebab-case`
- 变量在 `_defines/`，通用样式在 `_common/`，组件在 `_components/`
- 2 空格缩进，属性后空格
- CSS 兼容 IE8

## 浏览器 JS 规范

- ES5 语法（Gulp Babel 转译为 ES2015+）
- 避免直接操作 DOM，使用主题工具函数
- 注释: `//` 单行，`/* */` 多行

## 工作流程

每次修改必须遵循以下流程，产物保留在仓库中：

### 1. 方案

在 `docs/` 目录下创建或更新方案文档，描述：
- 要解决的问题或新增的能力
- 技术方案和实现思路
- 影响范围（涉及哪些文件/模块）

### 2. 执行计划

方案通过后，列出具体执行步骤，记录在对应文档中：
- 改动文件清单
- 分步实施顺序
- 依赖关系

### 3. 测试

变更完成后，在自己的 Hexo 项目中集成验证：
- **`npm run g && npx gulp minify` 全量验证**（`scripts/` 变更必须执行：`npm run g` 发现模板渲染错误，`npx gulp minify` 发现 HTML 结构错误如多余引号等）
- `npm run s` 启动本地服务
- 检查涉及的所有页面类型（首页、文章页、Wiki 页等）
- 验证浏览器兼容性
- 测试结果记录在 `docs/` 中

### 4. 文档归档

- 方案、执行计划、测试记录保存在 `docs/` 目录
- 文件命名: `docs/{YYYY-MM-DD}-{功能简称}.md`
- 涉及逻辑变更（API、配置项、行为变化）必须同步更新仓库 Wiki

### 新增功能 Checklist

新增功能必须覆盖以下维度:

1. `layout/` — EJS 模板
2. `scripts/` — Hexo 标签 / 辅助函数 / 过滤器
3. `source/css/` — Stylus 样式
4. `source/js/` — 浏览器脚本（如需）
5. `docs/` — 方案 + 执行计划 + 测试记录
6. `languages/` — 国际化文案（如需新增文本）

## 组件架构

### 自定义标签开发

1. 在 `scripts/tags/lib/` 下创建标签实现文件
2. 在 `scripts/tags/index.js` 中注册
3. 在 `source/css/_components/tag-plugins/` 添加对应样式
4. 推荐使用 `hexo` 参数传入，避免 `require('hexo')`

### 评论系统

- 接口目录: `layout/_partial/comments/`
- 每个评论系统提供 `layout.ejs` 和 `script.ejs`
- 遵循现有的配置驱动模式

## Git 规范

```
<type>(<scope>): <description>
```

| Type | 说明 |
|------|------|
| `feat` | 新功能 |
| `fix` | Bug 修复 |
| `refactor` | 重构 |
| `perf` | 性能优化 |
| `style` | CSS/样式修改 |
| `docs` | 文档更新 |

## 发版规范

发版分两步：脚本完成版本号更新和推送 → CI 自动完成 npm 发布和 tag 创建。

```
npm-publish.sh → push main + npm → CI → npm publish + git tag
```

### 使用方式

```bash
# 正常发版（CI 自动处理 npm publish 和 tag）
bash npm-publish.sh 1.33.2

# 预览模式（仅显示改动，不提交/推送，执行后自动回滚）
bash npm-publish.sh 1.33.2 --dry-run
```

### AI 调用指南

1. **分析变更确定版本号**: 查看上一版本以来的 commit，按以下规则确定版本号：
   - `x.y.z` → `x.y.(z+1)`: 仅含 fix / perf / style（修复和优化，安全升级）
   - `x.y.z` → `x.(y+1).0`: 含 feat / refactor / breaking change（功能增减、一般重构）
   - `x.y.z` → `(x+1).0.0`: 大型重构，用户可感知的设计调整
   - `x.y.z` → `x.y.z-rc.N`: 测试版本
2. **向用户确认**: 列出版本号和变更摘要，等待用户确认后再继续
3. **dry-run 预览**: `bash npm-publish.sh <version> --dry-run` 检查变更是否正确
4. **正式执行**: `bash npm-publish.sh <version>`
5. **CI 自动**: 检测 `release:` commit → npm publish + tag

## 约束

- **修改 `scripts/` 目录下任何文件后，必须运行 `npm run g && npx gulp minify` 验证构建成功。** `npm run g` 做全量渲染发现模板错误，`npx gulp minify` 做 HTML 压缩发现结构错误（如多余引号）。`npm run s` 是按需渲染，不能替代全量验证。
- 不引入新构建系统，保持 Hexo 原生 + Gulp 后处理
- 不混用 EJS 和前端框架语法
- CSS 兼容 IE8，JS 兼容 ES2015+
