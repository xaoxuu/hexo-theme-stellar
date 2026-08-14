# 执行计划

1. 模板与标签层：#401 → #564 → #523（验证+单测）
2. 样式层：#593/#663（func/sidebar/search.styl）→ #599（device.styl）
3. 评论与动态数据：#630 → #668 → #598
4. 功能：#302（helper + 面包屑行右侧展示）→ #466（table 标签）→ #602（tip 标签）→ #580（卡片标签）
5. 收尾：#594 date 格式
6. 测试与知识库：补单测；更新 docs/knowledge/ 相关页面并登记 VERIFICATION.md
7. 验证：npm run check + 主工程 npm run g
8. 发版：CHANGELOG 1.40.0 → release:dry → 确认后 release
9. 主仓库：更新子模块指针、同步 source/wiki/stellar/、更新 issue 状态（resolved 标签）
