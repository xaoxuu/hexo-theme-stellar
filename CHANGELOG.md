# Changelog

## [1.34.0](https://github.com/xaoxuu/hexo-theme-stellar/compare/1.33.1...1.34.0) (2026-08-08)


### Features

* add new-note command ([#595](https://github.com/xaoxuu/hexo-theme-stellar/issues/595)) ([19fa2ca](https://github.com/xaoxuu/hexo-theme-stellar/commit/19fa2ca664e763b538dba192087844afaaee0351))
* **ci:** add release-please config for automated release management ([450781e](https://github.com/xaoxuu/hexo-theme-stellar/commit/450781edefe7a9e817d647df79c454bb63696c9b))
* **ci:** add release-please for automated release management ([a814b1a](https://github.com/xaoxuu/hexo-theme-stellar/commit/a814b1a3776e6466474706805756f68b2fc1487c))
* **ci:** switch to npm Trusted Publishing (OIDC) ([9034f2c](https://github.com/xaoxuu/hexo-theme-stellar/commit/9034f2ca9486748c8c3e064b5dda72a215d7e0f2))
* **ci:** switch to npm Trusted Publishing (OIDC) ([0b88bb9](https://github.com/xaoxuu/hexo-theme-stellar/commit/0b88bb9652dada29f329b0d36a94e886baed68d4))
* support pjax to implement non-refresh loading ([#640](https://github.com/xaoxuu/hexo-theme-stellar/issues/640)) ([275773d](https://github.com/xaoxuu/hexo-theme-stellar/commit/275773d7ab991717cb484537dbc67bbd937f5729))
* support separate light/dark leftbar background colors when using solid color ([#622](https://github.com/xaoxuu/hexo-theme-stellar/issues/622)) ([bd21b76](https://github.com/xaoxuu/hexo-theme-stellar/commit/bd21b76f99e871f9ec7f6c0a286dc276189ec662))
* timeline support rss ([#633](https://github.com/xaoxuu/hexo-theme-stellar/issues/633)) ([e71b246](https://github.com/xaoxuu/hexo-theme-stellar/commit/e71b246d96d5b12c0c524e5136decf73d28d7866))


### Bug Fixes

* 639 ([1f27d69](https://github.com/xaoxuu/hexo-theme-stellar/commit/1f27d6998a4075f6742f33bddbb2081c0be8c416))
* add glob dependency, fix XSS in tag plugins, and replace deprecated copy API ([1b94065](https://github.com/xaoxuu/hexo-theme-stellar/commit/1b94065db43dd66f15916ff2ca6f5d9d1c99a1c0))
* add l_right selector ([105ca43](https://github.com/xaoxuu/hexo-theme-stellar/commit/105ca4353e986080cb430d542100776f1476fd1f))
* chat-file, dark mode, etc. ([#617](https://github.com/xaoxuu/hexo-theme-stellar/issues/617)) ([caa9672](https://github.com/xaoxuu/hexo-theme-stellar/commit/caa9672d80828b8291cf0d6c7bde97f33058755d))
* chat.js ([#610](https://github.com/xaoxuu/hexo-theme-stellar/issues/610)) ([48083e0](https://github.com/xaoxuu/hexo-theme-stellar/commit/48083e09ac33f707fe241801b28fdccac42dd358))
* chat.styl ([#611](https://github.com/xaoxuu/hexo-theme-stellar/issues/611)) ([dece2ac](https://github.com/xaoxuu/hexo-theme-stellar/commit/dece2ac4ed84545ee4ac29a862bb87a4538d7e92))
* **ci:** set empty component to prevent release-please deriving name from package.json ([3226350](https://github.com/xaoxuu/hexo-theme-stellar/commit/32263501ef615d05d14e433f9b665831173ed6a3))
* **ci:** use include-component-in-tag instead of component: "" ([631fa30](https://github.com/xaoxuu/hexo-theme-stellar/commit/631fa3045285bb3736c08cd658c13c247e73c2cd))
* **ci:** use npm publish instead of yarn ([381a4af](https://github.com/xaoxuu/hexo-theme-stellar/commit/381a4af1c7413ce5fd792f29be3b0a313a9123f0))
* correct lazyload dependency URL in defines template ([1ee926e](https://github.com/xaoxuu/hexo-theme-stellar/commit/1ee926e93be4c95ff252baff30a1902d714f77a8))
* crash of hexo-all-minifier & l_cover ([4a40236](https://github.com/xaoxuu/hexo-theme-stellar/commit/4a4023655cb4a89b2db833ec8eab85076925f16f))
* fancybox in memos ([9dc0b44](https://github.com/xaoxuu/hexo-theme-stellar/commit/9dc0b44d1ee164e4caf71e67765d43c5577e568c))
* **head:** correct shared page title metadata ([78bd769](https://github.com/xaoxuu/hexo-theme-stellar/commit/78bd7698c5209c8c6f298547d6e3fdb0522ddc34))
* **image:** move safeAlt to outer scope to prevent ReferenceError ([42fdf9c](https://github.com/xaoxuu/hexo-theme-stellar/commit/42fdf9c9a4b8620e3a945e8c7485d74a4b1fb5dd))
* katex ([#608](https://github.com/xaoxuu/hexo-theme-stellar/issues/608)) ([e9d3b34](https://github.com/xaoxuu/hexo-theme-stellar/commit/e9d3b343d39d283e73812c56b62a3db7f50cd9d9))
* PJAX navigation between pages with different comment systems ([#647](https://github.com/xaoxuu/hexo-theme-stellar/issues/647)) ([9da70d0](https://github.com/xaoxuu/hexo-theme-stellar/commit/9da70d0b3f463855e2f3af51107f9812dc3b202a))
* pjax not refresh dynamic components on page changed ([#645](https://github.com/xaoxuu/hexo-theme-stellar/issues/645)) ([a55fd95](https://github.com/xaoxuu/hexo-theme-stellar/commit/a55fd95781f06b6f93b9ce0bbd33615edc7aa471))
* preserve user theme preference during PJAX navigation ([#658](https://github.com/xaoxuu/hexo-theme-stellar/issues/658)) ([543ad0e](https://github.com/xaoxuu/hexo-theme-stellar/commit/543ad0eb39dbab7cc1029121864e5fe109d73acc))
* pretty_url ([6019a42](https://github.com/xaoxuu/hexo-theme-stellar/commit/6019a42824c49b3873a7c75b9c5561a6cd3c5270))
* Reinitialize comments after PJAX navigation ([#646](https://github.com/xaoxuu/hexo-theme-stellar/issues/646)) ([b073549](https://github.com/xaoxuu/hexo-theme-stellar/commit/b0735497ba01be3b5ff67f69f230e5d5efa8b748))
* remove loading for ghinfo ([2d855e8](https://github.com/xaoxuu/hexo-theme-stellar/commit/2d855e833d4895e5fe693e691e658514386512e6))
* resolve katex.min.css being blocked (xaoxuu/hexo-theme-stellar[#621](https://github.com/xaoxuu/hexo-theme-stellar/issues/621)) ([#624](https://github.com/xaoxuu/hexo-theme-stellar/issues/624)) ([7ed5ce9](https://github.com/xaoxuu/hexo-theme-stellar/commit/7ed5ce930516758dbf5ac09d7f2c385b4427677c))
* **timeline:** remove extra quote in class attribute causing HTML parse error ([c741987](https://github.com/xaoxuu/hexo-theme-stellar/commit/c741987bbca22bc765869d62fdcfd0f8cad52f65))
* 将 XML/RSS 文件加入 PJAX 黑名单  ([#661](https://github.com/xaoxuu/hexo-theme-stellar/issues/661)) ([288df32](https://github.com/xaoxuu/hexo-theme-stellar/commit/288df32d0bdf25493ee2b7e05874f6aea31691db))


### Performance Improvements

* add CSS preload and enable CDN preconnect for faster first paint ([18e6367](https://github.com/xaoxuu/hexo-theme-stellar/commit/18e6367db6deed748aa6b2c8944b1b885681e549))
* replace full jQuery with slim build to reduce payload ([3b579a3](https://github.com/xaoxuu/hexo-theme-stellar/commit/3b579a33426b1556743174e6026dbf6e6405b77a))
