// hexo.extend.tag.register('musicplayer', post_music_player, {ends: true});


// scripts/tags/netease.js



/**
 * swiper.js v1 | https://github.com/xaoxuu/hexo-theme-stellar/
 * 格式与官方标签插件一致使用空格分隔，中括号内的是可选参数（中括号不需要写出来）
    
    {% musicplayer from:netease id:aplayer3 song_id:436147423,1309394503,26590191 %}
    {% endmusicplayer %}
    
    {% musicplayer  from:netease id:aplayer song_id:436147423,1309394503,26590191 %}
    <!-- song -->
    url='https://raw.githubusercontent.com/user/images-1/main/music/1974443814.mp3'
    cover='https://raw.githubusercontent.com/user/images-1/main/music/1974443814.png'
    lrc='https://raw.githubusercontent.com/user/images-1/main/music/1974443814.lrc'
    name='我记得'
    artist='赵雷'
    <!-- song -->
    url='https://raw.githubusercontent.com/user/images-1/main/music/1974443814.mp3'
    cover='https://raw.githubusercontent.com/user/images-1/main/music/1974443814.png'
    lrc='https://raw.githubusercontent.com/user/images-1/main/music/1974443814.lrc'
    name='我记得'
    artist='赵雷'
    {% endmusicplayer %}
 */

'use strict'

module.exports = ctx => function(args, content) {
  args = ctx.args.map(args, ['from', 'id', 'song_id']);
  if (args.from == 'netease'){
    return '<div class=\"stellar-musicplayer\" ' + 'id=\"'+args.id+'\" from=\"'+args.from+'\" song_id=\"' + args.song_id + '\"></div>';
  }
  if (args.from == 'local'){
    var el = ''
    // 此处通过分隔符分割，容错率
    var songlist = content.split("<!-- song -->");
    var el = '<div class=\"stellar-musicplayer\" id=\"' + args.id + '\" from=\"local\">';
    for (var i = 1; i < songlist.length; i++) {
        el += '<div '+ songlist[i] +'  ></div>';
    }
    return el;
  }
  return '<div>这里的音乐播放器未正确渲染</div>'
}