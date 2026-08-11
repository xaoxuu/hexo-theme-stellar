'use strict';

/**
 * CI 专用 minify 校验（与主工程 xaoxuu.com 的 gulpfile.js 等价）
 *
 * 用途：在集成测试中复现主工程 `npm run g` 中的 HTML/CSS/JS
 * 压缩校验语义，用于发现模板结构错误（多余引号等）与内联 JS 语法错误。
 * 位于仓库根目录 ci/，仅由 .github/workflows/ci.yml 使用，
 * 不参与主题发布，也不会被 Hexo 作为主题脚本加载。
 */

const gulp = require('gulp');
const cleanCSS = require('gulp-clean-css');
const htmlmin = require('gulp-html-minifier-terser');
const terser = require('gulp-terser');
const sourcemaps = require('gulp-sourcemaps');
const babel = require('gulp-babel');

const minify_css = () => (
  gulp.src(['./public/**/*.css', '!./public/{lib,lib/**}', '!./public/{libs,libs/**}', '!./public/{media,media/**}'])
    .pipe(sourcemaps.init())
    .pipe(cleanCSS({ compatibility: 'ie8' }))
    .pipe(sourcemaps.write('./maps'))
    .pipe(gulp.dest('./public'))
);

const minify_html = () => (
  gulp.src(['./public/**/*.html', '!./public/{lib,lib/**}', '!./public/{libs,libs/**}', '!./public/{media,media/**}'])
    .pipe(htmlmin({
      removeComments: true,
      minifyJS: true,
      minifyCSS: true,
      minifyURLs: true,
    }))
    .pipe(gulp.dest('./public'))
);

const minify_js = () => (
  gulp.src(['./public/**/*.js', '!./public/**/*.min.js', '!./public/{lib,lib/**}', '!./public/{libs,libs/**}', '!./public/{media,media/**}'])
    .pipe(sourcemaps.init())
    .pipe(babel({
      presets: ['@babel/preset-env'],
    }))
    .pipe(terser({
      ecma: 2015,
      ie8: true,
      safari10: true,
      output: { comments: false },
    }))
    .pipe(sourcemaps.write('./maps'))
    .pipe(gulp.dest('./public'))
);

gulp.task('minify', gulp.parallel(
  minify_html,
  minify_css,
  minify_js,
));

gulp.task('default', gulp.series('minify'));
