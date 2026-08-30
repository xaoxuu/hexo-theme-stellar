# Stellar v2 配置 Reference

> 主题字段树与普通默认类型来自手写 `_config.yml`；例外约束来自轻量规则表。本页自动生成，请勿手工编辑。

YAML 使用 `path`，主题 JavaScript 仅将 snake_case 键转换为 `runtimePath` 的 camelCase。数组覆盖时整体替换；第三方 provider 参数袋保持开放。

## Theme

| Path | Runtime path | Type | Default | Exception constraints |
| --- | --- | --- | --- | --- |
| brand.image.src | brand.image.src | <code>["string","null"]</code> | <code>null</code> | validator=nullable_non_empty_string |
| brand.image.variant | brand.image.variant | <code>["string"]</code> | <code>"avatar"</code> | values=["avatar","icon","plain"] |
| brand.name | brand.name | <code>["string","null"]</code> | <code>null</code> | — |
| brand.tagline | brand.tagline | <code>["string","null"]</code> | <code>null</code> | — |
| menu.items[].type | menu.items[].type | <code>["string"]</code> | <code>"link"</code> | values=["link","search"] |
| menu.items[].id | menu.items[].id | <code>["string","null"]</code> | <code>null</code> | validator=nullable_kebab_id |
| menu.items[].title | menu.items[].title | <code>["string","null"]</code> | <code>null</code> | — |
| menu.items[].icon | menu.items[].icon | <code>["string","null"]</code> | <code>null</code> | validator=nullable_non_empty_string |
| menu.items[].url | menu.items[].url | <code>["string","null"]</code> | <code>null</code> | validator=nullable_safe_navigation_url |
| menu.items[].accent | menu.items[].accent | <code>["string","null"]</code> | <code>null</code> | validator=nullable_css_color |
| settings.about.items[].key | settings.about.items[].key | <code>["string"]</code> | <code>""</code> | validator=non_empty_string |
| settings.about.items[].value | settings.about.items[].value | <code>["string"]</code> | <code>""</code> | validator=non_empty_string |
| settings.about.items[].url | settings.about.items[].url | <code>["string","null"]</code> | <code>null</code> | validator=nullable_template_navigation_url |
| footer.actions[].type | footer.actions[].type | <code>["string"]</code> | <code>"link"</code> | values=["link","button","dropdown","spacer"] |
| footer.actions[].icon | footer.actions[].icon | <code>["string","null"]</code> | <code>null</code> | validator=nullable_non_empty_string |
| footer.actions[].title | footer.actions[].title | <code>["string","null"]</code> | <code>null</code> | — |
| footer.actions[].url | footer.actions[].url | <code>["string","null"]</code> | <code>null</code> | validator=nullable_safe_navigation_url |
| footer.actions[].onclick | footer.actions[].onclick | <code>["string","null"]</code> | <code>null</code> | validator=nullable_non_empty_string |
| footer.actions[].items[].type | footer.actions[].items[].type | <code>["string"]</code> | <code>"link"</code> | values=["link","button"] |
| footer.actions[].items[].icon | footer.actions[].items[].icon | <code>["string","null"]</code> | <code>null</code> | validator=nullable_non_empty_string |
| footer.actions[].items[].title | footer.actions[].items[].title | <code>["string"]</code> | <code>""</code> | validator=non_empty_string |
| footer.actions[].items[].url | footer.actions[].items[].url | <code>["string","null"]</code> | <code>null</code> | validator=nullable_safe_navigation_url |
| footer.actions[].items[].onclick | footer.actions[].items[].onclick | <code>["string","null"]</code> | <code>null</code> | validator=nullable_non_empty_string |
| footer.sections[].title | footer.sections[].title | <code>["string"]</code> | <code>""</code> | validator=non_empty_string |
| footer.sections[].items[].title | footer.sections[].items[].title | <code>["string"]</code> | <code>""</code> | validator=non_empty_string |
| footer.sections[].items[].url | footer.sections[].items[].url | <code>["string"]</code> | <code>""</code> | validator=safe_navigation_url |
| footer.content | footer.content | <code>["string"]</code> | <code>"本站由 [{author.name}](/) 使用 [{theme.name} {theme.version}]({theme.tree}) 主题创建。"</code> | — |
| topbar.widgets | topbar.widgets | <code>["array"]</code> | <code>[]</code> | validator=region_widgets |
| leftbar.default_state | leftbar.defaultState | <code>["string"]</code> | <code>"expanded"</code> | values=["expanded","collapsed"] |
| leftbar.enabled | leftbar.enabled | <code>["boolean"]</code> | <code>true</code> | — |
| leftbar.brand | leftbar.brand | <code>["string","boolean"]</code> | <code>"site_brand"</code> | values=[false,"site_brand","collection_brand"] |
| leftbar.menu | leftbar.menu | <code>["boolean"]</code> | <code>true</code> | — |
| leftbar.footer_actions | leftbar.footerActions | <code>["boolean"]</code> | <code>true</code> | — |
| leftbar.widgets | leftbar.widgets | <code>["array"]</code> | <code>[]</code> | validator=leftbar_content_widgets |
| rightbar.widgets | rightbar.widgets | <code>["array"]</code> | <code>[]</code> | validator=region_widgets |
| profiles.home.active_menu | profiles.home.activeMenu | <code>["string","null"]</code> | <code>null</code> | validator=nullable_kebab_id |
| profiles.home.leftbar.widgets | profiles.home.leftbar.widgets | <code>["array","null"]</code> | <code>null</code> | validator=leftbar_content_widgets |
| profiles.home.leftbar.enabled | profiles.home.leftbar.enabled | <code>["boolean","null"]</code> | <code>null</code> | — |
| profiles.home.leftbar.brand | profiles.home.leftbar.brand | <code>["string","boolean","null"]</code> | <code>null</code> | values=[null,false,"site_brand","collection_brand"] |
| profiles.home.leftbar.menu | profiles.home.leftbar.menu | <code>["boolean","null"]</code> | <code>null</code> | — |
| profiles.home.leftbar.footer_actions | profiles.home.leftbar.footerActions | <code>["boolean","null"]</code> | <code>null</code> | — |
| profiles.home.rightbar.widgets | profiles.home.rightbar.widgets | <code>["array","null"]</code> | <code>null</code> | validator=region_widgets |
| profiles.home.comments.enabled | profiles.home.comments.enabled | <code>["boolean"]</code> | <code>false</code> | — |
| profiles.home.comments.title | profiles.home.comments.title | <code>["string","null"]</code> | <code>null</code> | — |
| profiles.home.comments.id | profiles.home.comments.id | <code>["string","null"]</code> | <code>null</code> | validator=nullable_non_empty_string |
| profiles.home.comments.provider | profiles.home.comments.provider | <code>["string","null"]</code> | <code>null</code> | values=[null,"beaudar","utterances","giscus","twikoo","waline","artalk"] |
| profiles.home.comments.options | profiles.home.comments.options | <code>["object"]</code> | <code>{}</code> | — |
| profiles.home.path | profiles.home.path | <code>["string","null"]</code> | <code>null</code> | validator=nullable_non_empty_string |
| profiles.home.topbar.widgets | profiles.home.topbar.widgets | <code>["array","null"]</code> | <code>null</code> | validator=region_widgets |
| profiles.blog_index.path | profiles.blogIndex.path | <code>["string","null"]</code> | <code>null</code> | validator=nullable_non_empty_string |
| profiles.blog_index.active_menu | profiles.blogIndex.activeMenu | <code>["string","null"]</code> | <code>null</code> | validator=nullable_kebab_id |
| profiles.blog_index.leftbar.widgets | profiles.blogIndex.leftbar.widgets | <code>["array","null"]</code> | <code>null</code> | validator=leftbar_content_widgets |
| profiles.blog_index.leftbar.enabled | profiles.blogIndex.leftbar.enabled | <code>["boolean","null"]</code> | <code>null</code> | — |
| profiles.blog_index.leftbar.brand | profiles.blogIndex.leftbar.brand | <code>["string","boolean","null"]</code> | <code>null</code> | values=[null,false,"site_brand","collection_brand"] |
| profiles.blog_index.leftbar.menu | profiles.blogIndex.leftbar.menu | <code>["boolean","null"]</code> | <code>null</code> | — |
| profiles.blog_index.leftbar.footer_actions | profiles.blogIndex.leftbar.footerActions | <code>["boolean","null"]</code> | <code>null</code> | — |
| profiles.blog_index.rightbar.widgets | profiles.blogIndex.rightbar.widgets | <code>["array","null"]</code> | <code>null</code> | validator=region_widgets |
| profiles.blog_index.listing_nav.enabled | profiles.blogIndex.listingNav.enabled | <code>["boolean"]</code> | <code>true</code> | — |
| profiles.blog_index.listing_nav.tabs[].title | profiles.blogIndex.listingNav.tabs[].title | <code>["string"]</code> | <code>""</code> | validator=non_empty_string |
| profiles.blog_index.listing_nav.tabs[].url | profiles.blogIndex.listingNav.tabs[].url | <code>["string"]</code> | <code>""</code> | validator=safe_navigation_url |
| profiles.blog_index.topbar.widgets | profiles.blogIndex.topbar.widgets | <code>["array","null"]</code> | <code>null</code> | validator=region_widgets |
| profiles.topic_index.path | profiles.topicIndex.path | <code>["string","null"]</code> | <code>null</code> | validator=nullable_non_empty_string |
| profiles.topic_index.active_menu | profiles.topicIndex.activeMenu | <code>["string","null"]</code> | <code>null</code> | validator=nullable_kebab_id |
| profiles.topic_index.leftbar.widgets | profiles.topicIndex.leftbar.widgets | <code>["array","null"]</code> | <code>null</code> | validator=leftbar_content_widgets |
| profiles.topic_index.leftbar.enabled | profiles.topicIndex.leftbar.enabled | <code>["boolean","null"]</code> | <code>null</code> | — |
| profiles.topic_index.leftbar.brand | profiles.topicIndex.leftbar.brand | <code>["string","boolean","null"]</code> | <code>null</code> | values=[null,false,"site_brand","collection_brand"] |
| profiles.topic_index.leftbar.menu | profiles.topicIndex.leftbar.menu | <code>["boolean","null"]</code> | <code>null</code> | — |
| profiles.topic_index.leftbar.footer_actions | profiles.topicIndex.leftbar.footerActions | <code>["boolean","null"]</code> | <code>null</code> | — |
| profiles.topic_index.rightbar.widgets | profiles.topicIndex.rightbar.widgets | <code>["array","null"]</code> | <code>null</code> | validator=region_widgets |
| profiles.topic_index.topbar.widgets | profiles.topicIndex.topbar.widgets | <code>["array","null"]</code> | <code>null</code> | validator=region_widgets |
| profiles.wiki_index.path | profiles.wikiIndex.path | <code>["string","null"]</code> | <code>null</code> | validator=nullable_non_empty_string |
| profiles.wiki_index.active_menu | profiles.wikiIndex.activeMenu | <code>["string","null"]</code> | <code>null</code> | validator=nullable_kebab_id |
| profiles.wiki_index.leftbar.widgets | profiles.wikiIndex.leftbar.widgets | <code>["array","null"]</code> | <code>null</code> | validator=leftbar_content_widgets |
| profiles.wiki_index.leftbar.enabled | profiles.wikiIndex.leftbar.enabled | <code>["boolean","null"]</code> | <code>null</code> | — |
| profiles.wiki_index.leftbar.brand | profiles.wikiIndex.leftbar.brand | <code>["string","boolean","null"]</code> | <code>null</code> | values=[null,false,"site_brand","collection_brand"] |
| profiles.wiki_index.leftbar.menu | profiles.wikiIndex.leftbar.menu | <code>["boolean","null"]</code> | <code>null</code> | — |
| profiles.wiki_index.leftbar.footer_actions | profiles.wikiIndex.leftbar.footerActions | <code>["boolean","null"]</code> | <code>null</code> | — |
| profiles.wiki_index.rightbar.widgets | profiles.wikiIndex.rightbar.widgets | <code>["array","null"]</code> | <code>null</code> | validator=region_widgets |
| profiles.wiki_index.listing_nav.enabled | profiles.wikiIndex.listingNav.enabled | <code>["boolean"]</code> | <code>true</code> | — |
| profiles.wiki_index.listing_nav.tabs[].title | profiles.wikiIndex.listingNav.tabs[].title | <code>["string"]</code> | <code>""</code> | validator=non_empty_string |
| profiles.wiki_index.listing_nav.tabs[].url | profiles.wikiIndex.listingNav.tabs[].url | <code>["string"]</code> | <code>""</code> | validator=safe_navigation_url |
| profiles.wiki_index.topbar.widgets | profiles.wikiIndex.topbar.widgets | <code>["array","null"]</code> | <code>null</code> | validator=region_widgets |
| profiles.post.active_menu | profiles.post.activeMenu | <code>["string","null"]</code> | <code>null</code> | validator=nullable_kebab_id |
| profiles.post.leftbar.widgets | profiles.post.leftbar.widgets | <code>["array","null"]</code> | <code>null</code> | validator=leftbar_content_widgets |
| profiles.post.leftbar.enabled | profiles.post.leftbar.enabled | <code>["boolean","null"]</code> | <code>null</code> | — |
| profiles.post.leftbar.brand | profiles.post.leftbar.brand | <code>["string","boolean","null"]</code> | <code>null</code> | values=[null,false,"site_brand","collection_brand"] |
| profiles.post.leftbar.menu | profiles.post.leftbar.menu | <code>["boolean","null"]</code> | <code>null</code> | — |
| profiles.post.leftbar.footer_actions | profiles.post.leftbar.footerActions | <code>["boolean","null"]</code> | <code>null</code> | — |
| profiles.post.rightbar.widgets | profiles.post.rightbar.widgets | <code>["array","null"]</code> | <code>null</code> | validator=region_widgets |
| profiles.post.path | profiles.post.path | <code>["string","null"]</code> | <code>null</code> | validator=nullable_non_empty_string |
| profiles.post.topbar.widgets | profiles.post.topbar.widgets | <code>["array","null"]</code> | <code>null</code> | validator=region_widgets |
| profiles.topic.active_menu | profiles.topic.activeMenu | <code>["string","null"]</code> | <code>null</code> | validator=nullable_kebab_id |
| profiles.topic.leftbar.widgets | profiles.topic.leftbar.widgets | <code>["array","null"]</code> | <code>null</code> | validator=leftbar_content_widgets |
| profiles.topic.leftbar.enabled | profiles.topic.leftbar.enabled | <code>["boolean","null"]</code> | <code>null</code> | — |
| profiles.topic.leftbar.brand | profiles.topic.leftbar.brand | <code>["string","boolean","null"]</code> | <code>null</code> | values=[null,false,"site_brand","collection_brand"] |
| profiles.topic.leftbar.menu | profiles.topic.leftbar.menu | <code>["boolean","null"]</code> | <code>null</code> | — |
| profiles.topic.leftbar.footer_actions | profiles.topic.leftbar.footerActions | <code>["boolean","null"]</code> | <code>null</code> | — |
| profiles.topic.rightbar.widgets | profiles.topic.rightbar.widgets | <code>["array","null"]</code> | <code>null</code> | validator=region_widgets |
| profiles.topic.path | profiles.topic.path | <code>["string","null"]</code> | <code>null</code> | validator=nullable_non_empty_string |
| profiles.topic.topbar.widgets | profiles.topic.topbar.widgets | <code>["array","null"]</code> | <code>null</code> | validator=region_widgets |
| profiles.wiki.active_menu | profiles.wiki.activeMenu | <code>["string","null"]</code> | <code>null</code> | validator=nullable_kebab_id |
| profiles.wiki.topbar.widgets | profiles.wiki.topbar.widgets | <code>["array","null"]</code> | <code>null</code> | validator=region_widgets |
| profiles.wiki.leftbar.brand | profiles.wiki.leftbar.brand | <code>["string","boolean","null"]</code> | <code>null</code> | values=[null,false,"site_brand","collection_brand"] |
| profiles.wiki.leftbar.menu | profiles.wiki.leftbar.menu | <code>["boolean","null"]</code> | <code>null</code> | — |
| profiles.wiki.leftbar.footer_actions | profiles.wiki.leftbar.footerActions | <code>["boolean","null"]</code> | <code>null</code> | — |
| profiles.wiki.leftbar.widgets | profiles.wiki.leftbar.widgets | <code>["array","null"]</code> | <code>null</code> | validator=leftbar_content_widgets |
| profiles.wiki.leftbar.enabled | profiles.wiki.leftbar.enabled | <code>["boolean","null"]</code> | <code>null</code> | — |
| profiles.wiki.rightbar.widgets | profiles.wiki.rightbar.widgets | <code>["array","null"]</code> | <code>null</code> | validator=region_widgets |
| profiles.wiki.path | profiles.wiki.path | <code>["string","null"]</code> | <code>null</code> | validator=nullable_non_empty_string |
| profiles.notebook_index.path | profiles.notebookIndex.path | <code>["string","null"]</code> | <code>null</code> | validator=nullable_non_empty_string |
| profiles.notebook_index.active_menu | profiles.notebookIndex.activeMenu | <code>["string","null"]</code> | <code>null</code> | validator=nullable_kebab_id |
| profiles.notebook_index.leftbar.widgets | profiles.notebookIndex.leftbar.widgets | <code>["array","null"]</code> | <code>null</code> | validator=leftbar_content_widgets |
| profiles.notebook_index.leftbar.enabled | profiles.notebookIndex.leftbar.enabled | <code>["boolean","null"]</code> | <code>null</code> | — |
| profiles.notebook_index.leftbar.brand | profiles.notebookIndex.leftbar.brand | <code>["string","boolean","null"]</code> | <code>null</code> | values=[null,false,"site_brand","collection_brand"] |
| profiles.notebook_index.leftbar.menu | profiles.notebookIndex.leftbar.menu | <code>["boolean","null"]</code> | <code>null</code> | — |
| profiles.notebook_index.leftbar.footer_actions | profiles.notebookIndex.leftbar.footerActions | <code>["boolean","null"]</code> | <code>null</code> | — |
| profiles.notebook_index.rightbar.widgets | profiles.notebookIndex.rightbar.widgets | <code>["array","null"]</code> | <code>null</code> | validator=region_widgets |
| profiles.notebook_index.topbar.widgets | profiles.notebookIndex.topbar.widgets | <code>["array","null"]</code> | <code>null</code> | validator=region_widgets |
| profiles.note_index.active_menu | profiles.noteIndex.activeMenu | <code>["string","null"]</code> | <code>null</code> | validator=nullable_kebab_id |
| profiles.note_index.leftbar.brand | profiles.noteIndex.leftbar.brand | <code>["string","boolean","null"]</code> | <code>null</code> | values=[null,false,"site_brand","collection_brand"] |
| profiles.note_index.leftbar.widgets | profiles.noteIndex.leftbar.widgets | <code>["array","null"]</code> | <code>null</code> | validator=leftbar_content_widgets |
| profiles.note_index.leftbar.enabled | profiles.noteIndex.leftbar.enabled | <code>["boolean","null"]</code> | <code>null</code> | — |
| profiles.note_index.leftbar.menu | profiles.noteIndex.leftbar.menu | <code>["boolean","null"]</code> | <code>null</code> | — |
| profiles.note_index.leftbar.footer_actions | profiles.noteIndex.leftbar.footerActions | <code>["boolean","null"]</code> | <code>null</code> | — |
| profiles.note_index.rightbar.widgets | profiles.noteIndex.rightbar.widgets | <code>["array","null"]</code> | <code>null</code> | validator=region_widgets |
| profiles.note_index.path | profiles.noteIndex.path | <code>["string","null"]</code> | <code>null</code> | validator=nullable_non_empty_string |
| profiles.note_index.topbar.widgets | profiles.noteIndex.topbar.widgets | <code>["array","null"]</code> | <code>null</code> | validator=region_widgets |
| profiles.note.active_menu | profiles.note.activeMenu | <code>["string","null"]</code> | <code>null</code> | validator=nullable_kebab_id |
| profiles.note.leftbar.brand | profiles.note.leftbar.brand | <code>["string","boolean","null"]</code> | <code>null</code> | values=[null,false,"site_brand","collection_brand"] |
| profiles.note.leftbar.widgets | profiles.note.leftbar.widgets | <code>["array","null"]</code> | <code>null</code> | validator=leftbar_content_widgets |
| profiles.note.leftbar.enabled | profiles.note.leftbar.enabled | <code>["boolean","null"]</code> | <code>null</code> | — |
| profiles.note.leftbar.menu | profiles.note.leftbar.menu | <code>["boolean","null"]</code> | <code>null</code> | — |
| profiles.note.leftbar.footer_actions | profiles.note.leftbar.footerActions | <code>["boolean","null"]</code> | <code>null</code> | — |
| profiles.note.rightbar.widgets | profiles.note.rightbar.widgets | <code>["array","null"]</code> | <code>null</code> | validator=region_widgets |
| profiles.note.path | profiles.note.path | <code>["string","null"]</code> | <code>null</code> | validator=nullable_non_empty_string |
| profiles.note.topbar.widgets | profiles.note.topbar.widgets | <code>["array","null"]</code> | <code>null</code> | validator=region_widgets |
| profiles.author.path | profiles.author.path | <code>["string","null"]</code> | <code>null</code> | validator=nullable_non_empty_string |
| profiles.author.active_menu | profiles.author.activeMenu | <code>["string","null"]</code> | <code>null</code> | validator=nullable_kebab_id |
| profiles.author.leftbar.widgets | profiles.author.leftbar.widgets | <code>["array","null"]</code> | <code>null</code> | validator=leftbar_content_widgets |
| profiles.author.leftbar.enabled | profiles.author.leftbar.enabled | <code>["boolean","null"]</code> | <code>null</code> | — |
| profiles.author.leftbar.brand | profiles.author.leftbar.brand | <code>["string","boolean","null"]</code> | <code>null</code> | values=[null,false,"site_brand","collection_brand"] |
| profiles.author.leftbar.menu | profiles.author.leftbar.menu | <code>["boolean","null"]</code> | <code>null</code> | — |
| profiles.author.leftbar.footer_actions | profiles.author.leftbar.footerActions | <code>["boolean","null"]</code> | <code>null</code> | — |
| profiles.author.rightbar.widgets | profiles.author.rightbar.widgets | <code>["array","null"]</code> | <code>null</code> | validator=region_widgets |
| profiles.author.topbar.widgets | profiles.author.topbar.widgets | <code>["array","null"]</code> | <code>null</code> | validator=region_widgets |
| profiles.error.path | profiles.error.path | <code>["string","null"]</code> | <code>null</code> | validator=nullable_non_empty_string |
| profiles.error.active_menu | profiles.error.activeMenu | <code>["string","null"]</code> | <code>null</code> | validator=nullable_kebab_id |
| profiles.error.leftbar.widgets | profiles.error.leftbar.widgets | <code>["array","null"]</code> | <code>null</code> | validator=leftbar_content_widgets |
| profiles.error.leftbar.enabled | profiles.error.leftbar.enabled | <code>["boolean","null"]</code> | <code>null</code> | — |
| profiles.error.leftbar.brand | profiles.error.leftbar.brand | <code>["string","boolean","null"]</code> | <code>null</code> | values=[null,false,"site_brand","collection_brand"] |
| profiles.error.leftbar.menu | profiles.error.leftbar.menu | <code>["boolean","null"]</code> | <code>null</code> | — |
| profiles.error.leftbar.footer_actions | profiles.error.leftbar.footerActions | <code>["boolean","null"]</code> | <code>null</code> | — |
| profiles.error.rightbar.widgets | profiles.error.rightbar.widgets | <code>["array","null"]</code> | <code>null</code> | validator=region_widgets |
| profiles.error.topbar.widgets | profiles.error.topbar.widgets | <code>["array","null"]</code> | <code>null</code> | validator=region_widgets |
| profiles.page.active_menu | profiles.page.activeMenu | <code>["string","null"]</code> | <code>null</code> | validator=nullable_kebab_id |
| profiles.page.leftbar.widgets | profiles.page.leftbar.widgets | <code>["array","null"]</code> | <code>null</code> | validator=leftbar_content_widgets |
| profiles.page.leftbar.enabled | profiles.page.leftbar.enabled | <code>["boolean","null"]</code> | <code>null</code> | — |
| profiles.page.leftbar.brand | profiles.page.leftbar.brand | <code>["string","boolean","null"]</code> | <code>null</code> | values=[null,false,"site_brand","collection_brand"] |
| profiles.page.leftbar.menu | profiles.page.leftbar.menu | <code>["boolean","null"]</code> | <code>null</code> | — |
| profiles.page.leftbar.footer_actions | profiles.page.leftbar.footerActions | <code>["boolean","null"]</code> | <code>null</code> | — |
| profiles.page.rightbar.widgets | profiles.page.rightbar.widgets | <code>["array","null"]</code> | <code>null</code> | validator=region_widgets |
| profiles.page.path | profiles.page.path | <code>["string","null"]</code> | <code>null</code> | validator=nullable_non_empty_string |
| profiles.page.topbar.widgets | profiles.page.topbar.widgets | <code>["array","null"]</code> | <code>null</code> | validator=region_widgets |
| profiles.settings.path | profiles.settings.path | <code>["string","null"]</code> | <code>null</code> | validator=nullable_non_empty_string |
| profiles.settings.active_menu | profiles.settings.activeMenu | <code>["string","null"]</code> | <code>null</code> | validator=nullable_kebab_id |
| profiles.settings.leftbar.widgets | profiles.settings.leftbar.widgets | <code>["array","null"]</code> | <code>null</code> | validator=leftbar_content_widgets |
| profiles.settings.leftbar.enabled | profiles.settings.leftbar.enabled | <code>["boolean","null"]</code> | <code>null</code> | — |
| profiles.settings.leftbar.brand | profiles.settings.leftbar.brand | <code>["string","boolean","null"]</code> | <code>null</code> | values=[null,false,"site_brand","collection_brand"] |
| profiles.settings.leftbar.menu | profiles.settings.leftbar.menu | <code>["boolean","null"]</code> | <code>null</code> | — |
| profiles.settings.leftbar.footer_actions | profiles.settings.leftbar.footerActions | <code>["boolean","null"]</code> | <code>null</code> | — |
| profiles.settings.rightbar.widgets | profiles.settings.rightbar.widgets | <code>["array","null"]</code> | <code>null</code> | validator=region_widgets |
| profiles.settings.topbar.widgets | profiles.settings.topbar.widgets | <code>["array","null"]</code> | <code>null</code> | validator=region_widgets |
| article.style | article.style | <code>["string"]</code> | <code>"tech"</code> | values=["tech","story"] |
| article.paragraph_indent | article.paragraphIndent | <code>["string"]</code> | <code>"auto"</code> | values=["auto","always","never"] |
| article.listing.pinned_layout | article.listing.pinnedLayout | <code>["string"]</code> | <code>"carousel"</code> | values=["carousel","flat"] |
| article.listing.card_layout | article.listing.cardLayout | <code>["string"]</code> | <code>"hero"</code> | values=["hero","classic"] |
| article.listing.cover_ratio | article.listing.coverRatio | <code>["number"]</code> | <code>2</code> | min&gt;0 |
| article.listing.excerpt_length | article.listing.excerptLength | <code>["number"]</code> | <code>128</code> | min=0; validator=non_negative_integer |
| article.listing.show_tags | article.listing.showTags | <code>["boolean"]</code> | <code>false</code> | — |
| article.banner.ratio | article.banner.ratio | <code>["number"]</code> | <code>2.5</code> | min&gt;0 |
| article.category_colors.&lt;key&gt; | article.categoryColors.&lt;key&gt; | <code>["string"]</code> | <code>""</code> | validator=css_color |
| article.footer.license | article.footer.license | <code>["boolean","string"]</code> | <code>"本文采用 [署名-非商业性使用-相同方式共享 4.0 国际](https://creativecommons.org/licenses/by-nc-sa/4.0/) 许可协议，转载请注明出处。"</code> | validator=license_value |
| article.footer.share | article.footer.share | <code>["array"]</code> | <code>[]</code> | — |
| article.footer.show_tags | article.footer.showTags | <code>["boolean"]</code> | <code>true</code> | — |
| article.related_posts_limit | article.relatedPostsLimit | <code>["number"]</code> | <code>0</code> | min=0; validator=non_negative_integer |
| article.show_reading_time | article.showReadingTime | <code>["boolean"]</code> | <code>false</code> | — |
| notebook.listing.excerpt_length | notebook.listing.excerptLength | <code>["number"]</code> | <code>128</code> | min=0; validator=non_negative_integer |
| notebook.listing.per_page | notebook.listing.perPage | <code>["number","null"]</code> | <code>null</code> | min=0; validator=nullable_non_negative_integer |
| notebook.listing.sort.field | notebook.listing.sort.field | <code>["string"]</code> | <code>"updated"</code> | values=["date","updated","title"] |
| notebook.listing.sort.direction | notebook.listing.sort.direction | <code>["string"]</code> | <code>"desc"</code> | values=["asc","desc"] |
| notebook.tag_icons.&lt;key&gt; | notebook.tagIcons.&lt;key&gt; | <code>["string"]</code> | <code>""</code> | — |
| notebook.footer.license | notebook.footer.license | <code>["string","boolean","null"]</code> | <code>null</code> | validator=license_override |
| notebook.footer.share | notebook.footer.share | <code>["array","null"]</code> | <code>null</code> | — |
| appearance.preset | appearance.preset | <code>["string"]</code> | <code>"card"</code> | values=["card","glass","minimal","flat"] |
| appearance.color_scheme | appearance.colorScheme | <code>["string"]</code> | <code>"auto"</code> | values=["auto","light","dark"] |
| appearance.typography.font_size.root | appearance.typography.fontSize.root | <code>["string"]</code> | <code>"16px"</code> | validator=css_length |
| appearance.typography.font_size.inline_code | appearance.typography.fontSize.inlineCode | <code>["string"]</code> | <code>"85%"</code> | validator=css_length |
| appearance.typography.font_size.code_block | appearance.typography.fontSize.codeBlock | <code>["string"]</code> | <code>"0.8125rem"</code> | validator=css_length |
| appearance.typography.font_family.body | appearance.typography.fontFamily.body | <code>["string"]</code> | <code>"system-ui, \"Microsoft Yahei\", \"Segoe UI\", Arial, sans-serif"</code> | validator=css_font_family |
| appearance.typography.font_family.code | appearance.typography.fontFamily.code | <code>["string"]</code> | <code>"Menlo, Monaco, Consolas, system-ui, monospace, sans-serif"</code> | validator=css_font_family |
| appearance.typography.content_align | appearance.typography.contentAlign | <code>["string"]</code> | <code>"left"</code> | values=["left","center","right","justify"] |
| appearance.typography.heading_prefixes.h2 | appearance.typography.headingPrefixes.h2 | <code>["string"]</code> | <code>"#"</code> | — |
| appearance.typography.heading_prefixes.h3 | appearance.typography.headingPrefixes.h3 | <code>["string"]</code> | <code>"="</code> | — |
| appearance.typography.heading_prefixes.h4 | appearance.typography.headingPrefixes.h4 | <code>["string"]</code> | <code>"&#124;"</code> | — |
| appearance.typography.heading_prefixes.h5 | appearance.typography.headingPrefixes.h5 | <code>["string"]</code> | <code>":"</code> | — |
| appearance.shape.corner | appearance.shape.corner | <code>["string"]</code> | <code>"superellipse(1.25)"</code> | validator=corner_shape |
| appearance.shape.radius.card_large | appearance.shape.radius.cardLarge | <code>["string"]</code> | <code>"24px"</code> | validator=css_length |
| appearance.shape.radius.card | appearance.shape.radius.card | <code>["string"]</code> | <code>"16px"</code> | validator=css_length |
| appearance.shape.radius.card_small | appearance.shape.radius.cardSmall | <code>["string"]</code> | <code>"12px"</code> | validator=css_length |
| appearance.shape.radius.bar | appearance.shape.radius.bar | <code>["string"]</code> | <code>"12px"</code> | validator=css_length |
| appearance.shape.radius.image_large | appearance.shape.radius.imageLarge | <code>["string"]</code> | <code>"24px"</code> | validator=css_length |
| appearance.shape.radius.image | appearance.shape.radius.image | <code>["string"]</code> | <code>"16px"</code> | validator=css_length |
| appearance.shape.radius.image_small | appearance.shape.radius.imageSmall | <code>["string"]</code> | <code>"8px"</code> | validator=css_length |
| appearance.colors.primary | appearance.colors.primary | <code>["string"]</code> | <code>"hsl(192 98% 55%)"</code> | validator=css_color |
| appearance.colors.accent | appearance.colors.accent | <code>["string"]</code> | <code>"hsl(14 100% 57%)"</code> | validator=css_color |
| appearance.colors.link | appearance.colors.link | <code>["string"]</code> | <code>"hsl(207 90% 54%)"</code> | validator=css_color |
| appearance.gradients.primary_action | appearance.gradients.primaryAction | <code>["string"]</code> | <code>"linear-gradient(to right, hsl(215, 95%, 64%), hsl(195, 95%, 60%), hsl(165, 95%, 56%), hsl(165, 95%, 56%), hsl(195 95% 60%), hsl(215, 95%, 64%))"</code> | validator=css_gradient |
| appearance.gradients.search_bar | appearance.gradients.searchBar | <code>["string"]</code> | <code>"linear-gradient(to right, #04f3ff, #08ffc6, #ddf730, #ffbd19, #ff1fe0, #c418ff, #3b5bff, #04f3ff)"</code> | validator=css_gradient |
| appearance.code_block.scrollbar_width | appearance.codeBlock.scrollbarWidth | <code>["string"]</code> | <code>"4px"</code> | validator=css_length |
| appearance.code_block.highlight_stylesheet | appearance.codeBlock.highlightStylesheet | <code>["string","null"]</code> | <code>"https://gcore.jsdelivr.net/gh/highlightjs/cdn-release@11.9/build/styles/atom-one-dark.min.css"</code> | validator=nullable_resource |
| appearance.backgrounds.leftbar.type | appearance.backgrounds.leftbar.type | <code>["string"]</code> | <code>"gradient"</code> | values=["none","gradient","image"] |
| appearance.backgrounds.leftbar.image | appearance.backgrounds.leftbar.image | <code>["string","null"]</code> | <code>null</code> | validator=nullable_resource |
| appearance.backgrounds.leftbar.gradient.light | appearance.backgrounds.leftbar.gradient.light | <code>["array"]</code> | <code>["hsl(210 32% 84%)","hsl(188 44% 84%)","hsl(12 64% 73%)","hsl(35 100% 82%)"]</code> | validator=sidebar_gradient_colors |
| appearance.backgrounds.leftbar.gradient.dark | appearance.backgrounds.leftbar.gradient.dark | <code>["array"]</code> | <code>["hsl(210 16% 48%)","hsl(188 18% 50%)","hsl(12 30% 42%)","hsl(35 36% 49%)"]</code> | validator=sidebar_gradient_colors |
| appearance.backgrounds.leftbar.opacity | appearance.backgrounds.leftbar.opacity | <code>["number"]</code> | <code>1</code> | min=0; max=1 |
| appearance.backgrounds.leftbar.backdrop.radius | appearance.backgrounds.leftbar.backdrop.radius | <code>["string"]</code> | <code>"100px"</code> | validator=css_length |
| appearance.backgrounds.page.image | appearance.backgrounds.page.image | <code>["string","null"]</code> | <code>null</code> | validator=nullable_resource |
| appearance.backgrounds.page.backdrop.radius | appearance.backgrounds.page.backdrop.radius | <code>["string"]</code> | <code>"100px"</code> | validator=css_length |
| appearance.backgrounds.page.backdrop.overlay | appearance.backgrounds.page.backdrop.overlay | <code>["string"]</code> | <code>"var(--bg-a75)"</code> | validator=css_color |
| appearance.backgrounds.page.backdrop.saturation | appearance.backgrounds.page.backdrop.saturation | <code>["string"]</code> | <code>"300%"</code> | validator=css_percentage |
| canonical.host | canonical.host | <code>["string","null"]</code> | <code>null</code> | — |
| canonical.allowed_hosts | canonical.allowedHosts | <code>["array"]</code> | <code>["localhost"]</code> | — |
| open_graph.enabled | openGraph.enabled | <code>["boolean"]</code> | <code>true</code> | — |
| open_graph.twitter_id | openGraph.twitterId | <code>["string","null"]</code> | <code>null</code> | — |
| structured_data.same_as | structuredData.sameAs | <code>["array"]</code> | <code>[]</code> | — |
| preconnect | preconnect | <code>["array"]</code> | <code>[]</code> | — |
| fallbacks.avatar | fallbacks.avatar | <code>["string"]</code> | <code>"https://gcore.jsdelivr.net/gh/cdn-x/placeholder@1.0.12/avatar/round/3442075.svg"</code> | validator=resource |
| fallbacks.link_card | fallbacks.linkCard | <code>["string"]</code> | <code>"https://gcore.jsdelivr.net/gh/cdn-x/placeholder@1.0.12/link/8f277b4ee0ecd.svg"</code> | validator=resource |
| fallbacks.cover | fallbacks.cover | <code>["string"]</code> | <code>"https://gcore.jsdelivr.net/gh/cdn-x/placeholder@1.0.12/cover/76b86c0226ffd.svg"</code> | validator=resource |
| error_page.image | errorPage.image | <code>["string","null"]</code> | <code>"https://gcore.jsdelivr.net/gh/cdn-x/placeholder@1.0.12/404/1c830bfcd517d.svg"</code> | validator=nullable_resource |
| search.provider | search.provider | <code>["string","null"]</code> | <code>"local"</code> | values=[null,"local","algolia"] |
| search.local.scope | search.local.scope | <code>["string"]</code> | <code>"all"</code> | — |
| search.local.include_content | search.local.includeContent | <code>["boolean"]</code> | <code>true</code> | — |
| search.local.cache_ttl_seconds | search.local.cacheTtlSeconds | <code>["number"]</code> | <code>86400</code> | min=0; validator=non_negative_integer |
| search.algolia.appId | search.algolia.appId | <code>["null"]</code> | <code>null</code> | — |
| search.algolia.apiKey | search.algolia.apiKey | <code>["null"]</code> | <code>null</code> | — |
| search.algolia.indexName | search.algolia.indexName | <code>["null"]</code> | <code>null</code> | — |
| comments.provider | comments.provider | <code>["string","null"]</code> | <code>null</code> | values=[null,"beaudar","utterances","giscus","twikoo","waline","artalk"] |
| comments.title | comments.title | <code>["string","null"]</code> | <code>null</code> | — |
| comments.beaudar.repo | comments.beaudar.repo | <code>["string"]</code> | <code>"xxx/xxx"</code> | — |
| comments.beaudar.issue-term | comments.beaudar.issue-term | <code>["string"]</code> | <code>"pathname"</code> | — |
| comments.beaudar.issue-number | comments.beaudar.issue-number | <code>["null"]</code> | <code>null</code> | — |
| comments.beaudar.theme | comments.beaudar.theme | <code>["string"]</code> | <code>"preferred-color-scheme"</code> | — |
| comments.beaudar.label | comments.beaudar.label | <code>["null"]</code> | <code>null</code> | — |
| comments.beaudar.input-position | comments.beaudar.input-position | <code>["string"]</code> | <code>"top"</code> | — |
| comments.beaudar.comment-order | comments.beaudar.comment-order | <code>["string"]</code> | <code>"desc"</code> | — |
| comments.beaudar.keep-theme | comments.beaudar.keep-theme | <code>["null"]</code> | <code>null</code> | — |
| comments.beaudar.loading | comments.beaudar.loading | <code>["boolean"]</code> | <code>false</code> | — |
| comments.beaudar.branch | comments.beaudar.branch | <code>["string"]</code> | <code>"main"</code> | — |
| comments.utterances.repo | comments.utterances.repo | <code>["string"]</code> | <code>"xxx/xxx"</code> | — |
| comments.utterances.issue-term | comments.utterances.issue-term | <code>["string"]</code> | <code>"pathname"</code> | — |
| comments.utterances.issue-number | comments.utterances.issue-number | <code>["null"]</code> | <code>null</code> | — |
| comments.utterances.theme | comments.utterances.theme | <code>["string"]</code> | <code>"preferred-color-scheme"</code> | — |
| comments.utterances.label | comments.utterances.label | <code>["null"]</code> | <code>null</code> | — |
| comments.giscus.data-repo | comments.giscus.data-repo | <code>["string"]</code> | <code>"xxx/xxx"</code> | — |
| comments.giscus.data-repo-id | comments.giscus.data-repo-id | <code>["null"]</code> | <code>null</code> | — |
| comments.giscus.data-category | comments.giscus.data-category | <code>["null"]</code> | <code>null</code> | — |
| comments.giscus.data-category-id | comments.giscus.data-category-id | <code>["null"]</code> | <code>null</code> | — |
| comments.giscus.data-mapping | comments.giscus.data-mapping | <code>["string"]</code> | <code>"pathname"</code> | — |
| comments.giscus.data-strict | comments.giscus.data-strict | <code>["number"]</code> | <code>0</code> | — |
| comments.giscus.data-reactions-enabled | comments.giscus.data-reactions-enabled | <code>["number"]</code> | <code>1</code> | — |
| comments.giscus.data-emit-metadata | comments.giscus.data-emit-metadata | <code>["number"]</code> | <code>0</code> | — |
| comments.giscus.data-input-position | comments.giscus.data-input-position | <code>["string"]</code> | <code>"top"</code> | — |
| comments.giscus.data-theme | comments.giscus.data-theme | <code>["string"]</code> | <code>"preferred_color_scheme"</code> | — |
| comments.giscus.data-lang | comments.giscus.data-lang | <code>["string"]</code> | <code>"zh-CN"</code> | — |
| comments.giscus.data-loading | comments.giscus.data-loading | <code>["null"]</code> | <code>null</code> | — |
| comments.giscus.crossorigin | comments.giscus.crossorigin | <code>["string"]</code> | <code>"anonymous"</code> | — |
| comments.twikoo.envId | comments.twikoo.envId | <code>["string"]</code> | <code>"https://xxx"</code> | — |
| comments.waline.serverURL | comments.waline.serverURL | <code>["string"]</code> | <code>"https://waline.vercel.app"</code> | — |
| comments.waline.commentCount | comments.waline.commentCount | <code>["boolean"]</code> | <code>true</code> | — |
| comments.waline.pageview | comments.waline.pageview | <code>["boolean"]</code> | <code>false</code> | — |
| comments.artalk.server | comments.artalk.server | <code>["null"]</code> | <code>null</code> | — |
| comments.artalk.site | comments.artalk.site | <code>["string"]</code> | <code>""</code> | — |
| comments.artalk.darkMode | comments.artalk.darkMode | <code>["string"]</code> | <code>"auto"</code> | — |
| comments.artalk.imageUploader | comments.artalk.imageUploader | <code>["null"]</code> | <code>null</code> | — |
| tags.note.default_color | tags.note.defaultColor | <code>["string"]</code> | <code>""</code> | — |
| tags.note.border | tags.note.border | <code>["boolean"]</code> | <code>true</code> | — |
| tags.checkbox.interactive | tags.checkbox.interactive | <code>["boolean"]</code> | <code>false</code> | — |
| tags.quot.default.prefix | tags.quot.default.prefix | <code>["string"]</code> | <code>"quot:quote-left"</code> | — |
| tags.quot.default.suffix | tags.quot.default.suffix | <code>["string"]</code> | <code>"quot:quote-right"</code> | — |
| tags.quot.hashtag.prefix | tags.quot.hashtag.prefix | <code>["string"]</code> | <code>"quot:hashtag"</code> | — |
| tags.quot.hashtag.suffix | tags.quot.hashtag.suffix | <code>["null"]</code> | <code>null</code> | — |
| tags.quot.question.prefix | tags.quot.question.prefix | <code>["string"]</code> | <code>"quot:question"</code> | — |
| tags.quot.question.suffix | tags.quot.question.suffix | <code>["null"]</code> | <code>null</code> | — |
| tags.quot.&lt;variant&gt;.prefix | tags.quot.&lt;variant&gt;.prefix | <code>["string","null"]</code> | <code>null</code> | — |
| tags.quot.&lt;variant&gt;.suffix | tags.quot.&lt;variant&gt;.suffix | <code>["string","null"]</code> | <code>null</code> | — |
| tags.emoji.default_source | tags.emoji.defaultSource | <code>["string"]</code> | <code>"blobcat"</code> | validator=non_empty_string |
| tags.emoji.sources.&lt;key&gt; | tags.emoji.sources.&lt;key&gt; | <code>["string"]</code> | <code>""</code> | validator=emoji_template |
| tags.icon.default_color | tags.icon.defaultColor | <code>["string","null"]</code> | <code>"accent"</code> | — |
| tags.button.default_color | tags.button.defaultColor | <code>["string","null"]</code> | <code>"theme"</code> | — |
| tags.mark.default_color | tags.mark.defaultColor | <code>["string"]</code> | <code>"yellow"</code> | — |
| tags.hashtag.default_color | tags.hashtag.defaultColor | <code>["string","null"]</code> | <code>null</code> | — |
| tags.gallery.size | tags.gallery.size | <code>["string"]</code> | <code>"mix"</code> | values=["s","m","l","xl","mix"] |
| tags.gallery.aspect_ratio | tags.gallery.aspectRatio | <code>["string"]</code> | <code>"square"</code> | values=["original","square","portrait"] |
| features.lazy_loading.transition | features.lazyLoading.transition | <code>["string"]</code> | <code>"fade"</code> | values=["blur","fade"] |
| features.lazy_loading.auto_aspect_ratio | features.lazyLoading.autoAspectRatio | <code>["boolean"]</code> | <code>true</code> | — |
| features.link_prefetch.enabled | features.linkPrefetch.enabled | <code>["boolean"]</code> | <code>true</code> | — |
| features.color_scheme_switch.enabled | features.colorSchemeSwitch.enabled | <code>["boolean"]</code> | <code>false</code> | — |
| features.lightbox.enabled | features.lightbox.enabled | <code>["boolean"]</code> | <code>true</code> | — |
| features.lightbox.selector | features.lightbox.selector | <code>["string"]</code> | <code>".timenode p&gt;img"</code> | validator=css_selector |
| features.reveal.enabled | features.reveal.enabled | <code>["boolean"]</code> | <code>true</code> | — |
| features.math.provider | features.math.provider | <code>["string","null"]</code> | <code>null</code> | values=[null,"katex","mathjax"] |
| features.math.katex | features.math.katex | <code>["object"]</code> | <code>{}</code> | — |
| features.math.mathjax | features.math.mathjax | <code>["object"]</code> | <code>{}</code> | — |
| features.diagrams.provider | features.diagrams.provider | <code>["string","null"]</code> | <code>null</code> | values=[null,"mermaid"] |
| features.diagrams.mermaid.theme | features.diagrams.mermaid.theme | <code>["string"]</code> | <code>"neutral"</code> | values=["default","dark","forest","neutral"] |
| features.card_hover.enabled | features.cardHover.enabled | <code>["boolean"]</code> | <code>false</code> | — |
| features.heti.enabled | features.heti.enabled | <code>["boolean"]</code> | <code>false</code> | — |
| services.site_info.provider | services.siteInfo.provider | <code>["string","null"]</code> | <code>"site_info_api"</code> | values=[null,"site_info_api"] |
| services.site_info.site_info_api.endpoint | services.siteInfo.site_info_api.endpoint | <code>["string"]</code> | <code>"https://api.xaox.cc/site_info/v1?url={href}"</code> | validator=absolute_http_url |
| services.rating.provider | services.rating.provider | <code>["string","null"]</code> | <code>"star_vote"</code> | values=[null,"star_vote"] |
| services.rating.star_vote.endpoint | services.rating.star_vote.endpoint | <code>["string"]</code> | <code>"https://star-vote.xaox.cc/api/rating"</code> | validator=absolute_http_url |
| services.vote.provider | services.vote.provider | <code>["string","null"]</code> | <code>"star_vote"</code> | values=[null,"star_vote"] |
| services.vote.star_vote.endpoint | services.vote.star_vote.endpoint | <code>["string"]</code> | <code>"https://star-vote.xaox.cc/api/vote"</code> | validator=absolute_http_url |
| services.contributors.provider | services.contributors.provider | <code>["string"]</code> | <code>"github"</code> | values=["github"] |
| services.contributors.github.repositories[].source_prefix | services.contributors.github.repositories[].sourcePrefix | <code>["string"]</code> | <code>""</code> | validator=safe_relative_path |
| services.contributors.github.repositories[].repository | services.contributors.github.repositories[].repository | <code>["string"]</code> | <code>""</code> | validator=github_repository |
| services.contributors.github.repositories[].branch | services.contributors.github.repositories[].branch | <code>["string"]</code> | <code>"main"</code> | validator=non_empty_string |
| services.github.api_url | services.github.apiUrl | <code>["string"]</code> | <code>"https://api.github.com"</code> | validator=absolute_http_url |
| services.github.raw_url | services.github.rawUrl | <code>["string"]</code> | <code>"https://raw.githubusercontent.com"</code> | validator=absolute_http_url |
| services.github.gist_url | services.github.gistUrl | <code>["string"]</code> | <code>"https://gist.github.com"</code> | validator=absolute_http_url |
| services.github_card.provider | services.githubCard.provider | <code>["string"]</code> | <code>"github_readme_stats"</code> | values=["github_readme_stats"] |
| services.github_card.github_readme_stats.endpoint | services.githubCard.github_readme_stats.endpoint | <code>["string"]</code> | <code>"https://github-readme-stats.vercel.app"</code> | validator=absolute_http_url |
| inject.head_end | inject.headEnd | <code>["string"]</code> | <code>""</code> | — |
| inject.body_end | inject.bodyEnd | <code>["string"]</code> | <code>""</code> | — |

## Collection

| Path | Runtime path | Type | Default | Exception constraints |
| --- | --- | --- | --- | --- |
| card.cover | card.cover | <code>["string","null"]</code> | <code>{"kind":"derived","sources":["theme or collection card.cover"]}</code> | — |
| card.tagline | card.tagline | <code>["string","null"]</code> | <code>{"kind":"derived","sources":["theme or collection card.tagline"]}</code> | — |
| topbar.widgets | topbar.widgets | <code>["array"]</code> | <code>[]</code> | validator=region_widgets |
| leftbar.enabled | leftbar.enabled | <code>["boolean","null"]</code> | <code>null</code> | — |
| leftbar.brand | leftbar.brand | <code>["string","boolean","null"]</code> | <code>null</code> | values=[null,false,"site_brand","collection_brand"] |
| leftbar.menu | leftbar.menu | <code>["boolean","null"]</code> | <code>null</code> | — |
| leftbar.footer.actions | leftbar.footer.actions | <code>["boolean","null"]</code> | <code>null</code> | — |
| leftbar.widgets | leftbar.widgets | <code>["array"]</code> | <code>[]</code> | validator=leftbar_content_widgets |
| rightbar.widgets | rightbar.widgets | <code>["array"]</code> | <code>[]</code> | validator=region_widgets |
| navigation.menu | navigation.menu | <code>["string","null"]</code> | <code>null</code> | — |
| navigation.breadcrumb | navigation.breadcrumb | <code>["boolean","null"]</code> | <code>null</code> | — |
| navigation.tree | navigation.tree | <code>["array","object"]</code> | <code>[]</code> | validator=string_tree |
| article.style | article.style | <code>["string","null"]</code> | <code>null</code> | values=["tech","story"] |
| article.paragraph_indent | article.paragraphIndent | <code>["string","null"]</code> | <code>null</code> | values=["auto","always","never"] |
| article.author | article.author | <code>["string","null"]</code> | <code>null</code> | — |
| article.ai_label | article.aiLabel | <code>["string","null"]</code> | <code>null</code> | values=["manual","reviewed","polished","generated",null] |
| footer.references[] | footer.references[] | <code>["object","string"]</code> | <code>{}</code> | — |
| footer.license | footer.license | <code>["boolean","string","null"]</code> | <code>null</code> | validator=license_override |
| footer.share | footer.share | <code>["boolean","array","null"]</code> | <code>null</code> | validator=share_override |
| footer.show_tags | footer.showTags | <code>["boolean","null"]</code> | <code>null</code> | — |
| comments.enabled | comments.enabled | <code>["boolean","null"]</code> | <code>null</code> | — |
| comments.title | comments.title | <code>["string","null"]</code> | <code>null</code> | — |
| comments.id | comments.id | <code>["string","null"]</code> | <code>null</code> | — |
| comments.provider | comments.provider | <code>["string","null"]</code> | <code>null</code> | validator=nullable_non_empty_string |
| comments.options | comments.options | <code>["object"]</code> | <code>{}</code> | — |
| source.repository | source.repository | <code>["string","null"]</code> | <code>null</code> | — |
| source.branch | source.branch | <code>["string","null"]</code> | <code>null</code> | — |
| name | name | <code>["string"]</code> | <code>{"kind":"derived","sources":["required collection identity"]}</code> | validator=non_empty_string |
| headline | headline | <code>["string","null"]</code> | <code>null</code> | — |
| tagline | tagline | <code>["string","null"]</code> | <code>null</code> | — |
| description | description | <code>["string","null"]</code> | <code>null</code> | — |
| tags | tags | <code>["array"]</code> | <code>[]</code> | — |
| audience | audience | <code>["string","null"]</code> | <code>null</code> | — |
| identity.icon | identity.icon | <code>["string","null"]</code> | <code>null</code> | — |
| hero.enabled | hero.enabled | <code>["boolean","null"]</code> | <code>null</code> | — |
| hero.background.image | hero.background.image | <code>["string","null"]</code> | <code>null</code> | — |
| hero.background.effect | hero.background.effect | <code>["object","null"]</code> | <code>null</code> | validator=effect |
| hero.preview.type | hero.preview.type | <code>["string","null"]</code> | <code>null</code> | values=["terminal","image"] |
| hero.preview.src | hero.preview.src | <code>["string","null"]</code> | <code>null</code> | — |
| hero.preview.alt | hero.preview.alt | <code>["string","null"]</code> | <code>null</code> | — |
| hero.preview.commands[].label | hero.preview.commands[].label | <code>["string","null"]</code> | <code>null</code> | — |
| hero.preview.commands[].codes | hero.preview.commands[].codes | <code>["string","null"]</code> | <code>null</code> | — |
| hero.actions[].title | hero.actions[].title | <code>["string","null"]</code> | <code>null</code> | — |
| hero.actions[].url | hero.actions[].url | <code>["string","null"]</code> | <code>null</code> | — |
| hero.actions[].icon | hero.actions[].icon | <code>["string","null"]</code> | <code>null</code> | — |
| route.path | route.path | <code>["string"]</code> | <code>{"kind":"derived","sources":["collection route"]}</code> | — |
| route.start | route.start | <code>["string","null"]</code> | <code>null</code> | validator=topic_route_start |
| listing.priority | listing.priority | <code>["number","null"]</code> | <code>null</code> | min=0; validator=non_negative_integer |
| listing.order | listing.order | <code>["number","null"]</code> | <code>null</code> | min=0; validator=nullable_non_negative_integer |
| listing.excerpt_length | listing.excerptLength | <code>["number","null"]</code> | <code>null</code> | min=0; validator=nullable_non_negative_integer |
| listing.per_page | listing.perPage | <code>["number","null"]</code> | <code>null</code> | min=0; validator=nullable_non_negative_integer |
| listing.sort.field | listing.sort.field | <code>["string","null"]</code> | <code>null</code> | values=["date","updated","title"] |
| listing.sort.direction | listing.sort.direction | <code>["string","null"]</code> | <code>null</code> | values=["asc","desc"] |
| note_defaults.topbar.widgets | noteDefaults.topbar.widgets | <code>["array"]</code> | <code>[]</code> | validator=region_widgets |
| note_defaults.leftbar.enabled | noteDefaults.leftbar.enabled | <code>["boolean","null"]</code> | <code>null</code> | — |
| note_defaults.leftbar.brand | noteDefaults.leftbar.brand | <code>["string","boolean","null"]</code> | <code>null</code> | values=[null,false,"site_brand","collection_brand"] |
| note_defaults.leftbar.menu | noteDefaults.leftbar.menu | <code>["boolean","null"]</code> | <code>null</code> | — |
| note_defaults.leftbar.footer.actions | noteDefaults.leftbar.footer.actions | <code>["boolean","null"]</code> | <code>null</code> | — |
| note_defaults.leftbar.widgets | noteDefaults.leftbar.widgets | <code>["array"]</code> | <code>[]</code> | validator=leftbar_content_widgets |
| note_defaults.rightbar.widgets | noteDefaults.rightbar.widgets | <code>["array"]</code> | <code>[]</code> | validator=region_widgets |

## Front Matter

| Path | Runtime path | Type | Default | Exception constraints |
| --- | --- | --- | --- | --- |
| card.cover | card.cover | <code>["string","null"]</code> | <code>{"kind":"derived","sources":["theme or collection card.cover"]}</code> | — |
| card.tagline | card.tagline | <code>["string","null"]</code> | <code>{"kind":"derived","sources":["theme or collection card.tagline"]}</code> | — |
| topbar.widgets | topbar.widgets | <code>["array"]</code> | <code>[]</code> | validator=region_widgets |
| leftbar.enabled | leftbar.enabled | <code>["boolean","null"]</code> | <code>null</code> | — |
| leftbar.brand | leftbar.brand | <code>["string","boolean","null"]</code> | <code>null</code> | values=[null,false,"site_brand","collection_brand"] |
| leftbar.menu | leftbar.menu | <code>["boolean","null"]</code> | <code>null</code> | — |
| leftbar.footer.actions | leftbar.footer.actions | <code>["boolean","null"]</code> | <code>null</code> | — |
| leftbar.widgets | leftbar.widgets | <code>["array"]</code> | <code>[]</code> | validator=leftbar_content_widgets |
| rightbar.widgets | rightbar.widgets | <code>["array"]</code> | <code>[]</code> | validator=region_widgets |
| navigation.menu | navigation.menu | <code>["string","null"]</code> | <code>null</code> | — |
| navigation.breadcrumb | navigation.breadcrumb | <code>["boolean","null"]</code> | <code>null</code> | — |
| article.style | article.style | <code>["string","null"]</code> | <code>null</code> | values=["tech","story"] |
| article.paragraph_indent | article.paragraphIndent | <code>["string","null"]</code> | <code>null</code> | values=["auto","always","never"] |
| article.author | article.author | <code>["string","null"]</code> | <code>null</code> | — |
| article.ai_label | article.aiLabel | <code>["string","null"]</code> | <code>null</code> | values=["manual","reviewed","polished","generated",null] |
| footer.references[] | footer.references[] | <code>["object","string"]</code> | <code>{}</code> | — |
| footer.license | footer.license | <code>["boolean","string","null"]</code> | <code>null</code> | validator=license_override |
| footer.share | footer.share | <code>["boolean","array","null"]</code> | <code>null</code> | validator=share_override |
| footer.show_tags | footer.showTags | <code>["boolean","null"]</code> | <code>null</code> | — |
| comments.enabled | comments.enabled | <code>["boolean","null"]</code> | <code>null</code> | — |
| comments.title | comments.title | <code>["string","null"]</code> | <code>null</code> | — |
| comments.id | comments.id | <code>["string","null"]</code> | <code>null</code> | — |
| comments.provider | comments.provider | <code>["string","null"]</code> | <code>null</code> | validator=nullable_non_empty_string |
| comments.options | comments.options | <code>["object"]</code> | <code>{}</code> | — |
| source.repository | source.repository | <code>["string","null"]</code> | <code>null</code> | — |
| source.branch | source.branch | <code>["string","null"]</code> | <code>null</code> | — |
| collection.profile | collection.profile | <code>["string"]</code> | <code>{"kind":"derived","sources":["required collection profile"]}</code> | values=["wiki","topic","notebook"] |
| collection.id | collection.id | <code>["string"]</code> | <code>{"kind":"derived","sources":["required collection ID"]}</code> | validator=non_empty_string |
| banner.enabled | banner.enabled | <code>["boolean","null"]</code> | <code>null</code> | — |
| banner.image | banner.image | <code>["string","null"]</code> | <code>null</code> | — |
| banner.avatar | banner.avatar | <code>["string","null"]</code> | <code>null</code> | — |
| banner.headline | banner.headline | <code>["string","null"]</code> | <code>null</code> | — |
| banner.tagline | banner.tagline | <code>["string","null"]</code> | <code>null</code> | — |
| visibility.listed | visibility.listed | <code>["boolean"]</code> | <code>true</code> | — |
| visibility.searchable | visibility.searchable | <code>["boolean"]</code> | <code>true</code> | — |
| listing.priority | listing.priority | <code>["number"]</code> | <code>0</code> | min=0; validator=non_negative_integer |
| render.math | render.math | <code>["boolean","string"]</code> | <code>false</code> | values=[false,"katex","mathjax"] |
| render.diagrams | render.diagrams | <code>["boolean","string","object"]</code> | <code>false</code> | validator=diagrams_override |
| seo.open_graph | seo.openGraph | <code>["object"]</code> | <code>{}</code> | — |
| inject.head_end | inject.headEnd | <code>["string"]</code> | <code>""</code> | — |
| inject.body_end | inject.bodyEnd | <code>["string"]</code> | <code>""</code> | — |
