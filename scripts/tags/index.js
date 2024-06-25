/* global hexo */

'use strict';

// container
hexo.extend.tag.register('tabs', require('./lib/tabs')(hexo), true)
hexo.extend.tag.register('box', require('./lib/box')(hexo), true)
hexo.extend.tag.register('about', require('./lib/about')(hexo), true)
hexo.extend.tag.register('folding', require('./lib/folding')(hexo), true)
hexo.extend.tag.register('folders', require('./lib/folders')(hexo), true)
hexo.extend.tag.register('grid', require('./lib/grid')(hexo), true)
hexo.extend.tag.register('swiper', require('./lib/swiper')(hexo), true)
hexo.extend.tag.register('gallery', require('./lib/gallery')(hexo), {ends: true})
hexo.extend.tag.register('banner', require('./lib/banner')(hexo), true)

// data
hexo.extend.tag.register('users', require('./lib/friends')(hexo))
hexo.extend.tag.register('friends', require('./lib/friends')(hexo))
hexo.extend.tag.register('albums', require('./lib/albums')(hexo))
hexo.extend.tag.register('posters', require('./lib/posters')(hexo))
hexo.extend.tag.register('sites', require('./lib/sites')(hexo))
hexo.extend.tag.register('ghcard', require('./lib/ghcard')(hexo))
hexo.extend.tag.register('toc', require('./lib/toc')(hexo))
hexo.extend.tag.register('timeline', require('./lib/timeline')(hexo), {ends: true})
hexo.extend.tag.register('md', require('./lib/md')(hexo))

// express
hexo.extend.tag.register('checkbox', require('./lib/checkbox')(hexo, 'checkbox'))
hexo.extend.tag.register('radio', require('./lib/checkbox')(hexo, 'radio'))
hexo.extend.tag.register('copy', require('./lib/copy')(hexo))
hexo.extend.tag.register('emoji', require('./lib/emoji')(hexo))
hexo.extend.tag.register('icon', require('./lib/icon')(hexo))
hexo.extend.tag.register('frame', require('./lib/frame')(hexo))
hexo.extend.tag.register('image', require('./lib/image')(hexo))
hexo.extend.tag.register('link', require('./lib/link')(hexo))
hexo.extend.tag.register('button', require('./lib/button')(hexo))
hexo.extend.tag.register('mark', require('./lib/mark')(hexo))
hexo.extend.tag.register('navbar', require('./lib/navbar')(hexo))
hexo.extend.tag.register('note', require('./lib/note')(hexo))
hexo.extend.tag.register('poetry', require('./lib/poetry')(hexo), true)
hexo.extend.tag.register('quot', require('./lib/quot')(hexo))
hexo.extend.tag.register('hashtag', require('./lib/hashtag')(hexo))
hexo.extend.tag.register('okr', require('./lib/okr')(hexo), {ends: true})
hexo.extend.tag.register('audio', require('./lib/audio')(hexo))
hexo.extend.tag.register('video', require('./lib/video')(hexo))

// read 阅读类
hexo.extend.tag.register('reel', require('./lib/read/reel')(hexo), true)
hexo.extend.tag.register('paper', require('./lib/read/paper')(hexo), true)

// others
