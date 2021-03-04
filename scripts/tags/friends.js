/**
 * friends.js v1 | https://github.com/xaoxuu/hexo-theme-stellar/
 * 格式与官方标签插件一致使用空格分隔，中括号内的是可选参数（中括号不需要写出来）
 *
 * {% friends [only:group1] [not:group2] %}
 */

'use strict';

hexo.extend.tag.register('friends', function(args) {
  args = hexo.args.map(args, ['only', 'not']);
  if (args.only) {
    args.only = args.only.split(',');
  }
  if (args.not) {
    args.not = args.not.split(',');
  }
  var friends = hexo.locals.get('data').friends;
  if (friends == undefined) {
    friends = {};
  }
  var el = '<div class="tag-plugin friends-wrap">';
  function groupHeader(group) {
    var header = '<div class="group-header">';
    if (group.title) {
      header += hexo.render.renderSync({text: group.title, engine: 'markdown'}).split('\n').join('');
    }
    if (group.description) {
      header += hexo.render.renderSync({text: group.description, engine: 'markdown'}).split('\n').join('');
    }
    header += '</div>';
    return header;
  }
  function cell(friend) {
    if (friend.url && friend.title) {
      var cell = '<div class="user-simple">';
      cell += '<a class="user-link" target="_blank" rel="external nofollow noopener noreferrer" href="' + friend.url + '">';
      cell += '<img src="' + (friend.avatar || 'https://7.dusays.com/2021/03/03/87519671e4837.svg') + '" onerror="javascript:this.src=\'https://7.dusays.com/2021/03/03/87519671e4837.svg\';"/>';
      cell += '<div class="name"><span>' + friend.title + '</span></div>';
      cell += '</a></div>'
      return cell;
    } else {
      return '';
    }
  }
  for (let groupId of Object.keys(friends)) {
    function f() {
      if (args.not && args.not.includes(groupId)) {
        return;
      }
      if (groupId in friends) {
        let group = friends[groupId];
        if (group.title || group.description) {
          el += groupHeader(group);
        }
        if (group.repo) {
          el += '<div class="friendsjs-wrap"';
          el += ' id="friends-api"';
          el += ' api="' + (group.api || 'https://issues-api.vercel.app') + '/' + group.repo + '"';
          el += '>';
          el += '<div class="group-body"></div>';
          el += '</div>';
        } else if (group.items) {
          el += '<div class="group-body">';
          group.items.forEach((friend, i) => {
            el += cell(friend);
          });
          el += '</div>';
        }
      }
    }
    if (args.only) {
      if (args.only.includes(groupId)) {
        f();
      }
    } else {
      f();
    }
  }
  el += '</div>';
  return el;
});
