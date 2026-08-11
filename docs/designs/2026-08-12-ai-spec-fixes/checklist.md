# 验证清单：修正并重构 AI 工程规范

- [ ] AGENTS.md 已合并全部实质章节且无重复矛盾
- [ ] 技术栈表为 CommonJS（Node 22+）/ ES2015+（Babel 转译输出）
- [ ] 验证命令注明在主工程（themes/stellar 子模块依赖）执行，`npm run g` 已含 minify
- [ ] Commit type 表含 chore / content / release
- [ ] `_config.yml` 职责已澄清
- [ ] 知识库核查措辞为「硬事实异常拦截，未解析/配置键仅报告」
- [ ] CLAUDE.md 为「入口 + 关键要点」，copilot-instructions.md 为纯入口
- [ ] skill 与 tag-plugins-style-guide 引用已同步
- [ ] PR 模板 / 方案模板 / gulpfile 注释的命令表述已同步
- [ ] verify.py 硬事实异常退出码 1，正常时退出码 0
- [ ] `npm run check` 通过
- [ ] grep 校验通过（ES5 / 冗余命令 / CLAUDE 作为详细规范的引用清零）
- [ ] 提交格式符合 Conventional Commits 白名单，未 push
