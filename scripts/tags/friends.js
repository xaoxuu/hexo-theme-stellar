/**
 * friends.js v1 | https://github.com/xaoxuu/hexo-theme-stellar/
 * 格式与官方标签插件一致使用空格分隔，中括号内的是可选参数（中括号不需要写出来）
 *
 * {% friends [style:rect] [group:name] %}
 * {% friends [api:https://issues-api.vercel.app] [repo:xaoxuu/friends] %}
 */

'use strict';

hexo.extend.tag.register('friends', function(args) {
  args = hexo.args.map(args, ['style', 'group', 'repo']);
  var friends = hexo.locals.get('data').friends;
  if (friends == undefined) {
    friends = {};
  }
  var el = '<div class="tag-plugin friends-wrap issues-wrap ';
  if (args.style && args.style.length > 0) {
    el += args.style;
  } else {
    el += 'round';
  }
  el += '"';
  if (args.repo) {
    el += ' id="issues-api"';
    el += ' api="' + (args.api || 'https://issues-api.vercel.app') + '/' + args.repo + '"';
  }
  el += '>';
  if (args.repo) {
    el += '<div class="group-body"></div>';
  } else {
    function groupHeader(group) {
      var header = '<div class="group-header">';
      if (!!group.title) {
        header += '<p class="title">' + group.title + '</p>';
      }
      if (!!group.description) {
        header += '<p class="description">' + group.description + '</p>';
      }
      header += '</div>';
      return header;
    }
    function cell(friend) {
      if (friend.url && friend.title) {
        var cell = '<div class="user-simple">';
        cell += '<a href="' + friend.url + '">';
        cell += '<img src="' + friend.avatar + '"/>';
        cell += '<div class="name"><span>' + friend.title + '</span></div>';
        cell += '</a></div>'
        return cell;
      } else {
        return '';
      }
    }
    for (let groupId of Object.keys(friends)) {
      function f() {
        if (groupId in friends) {
          let group = friends[groupId];
          el += groupHeader(group);
          el += '<div class="group-body">';
          group.items.forEach((friend, i) => {
            el += cell(friend);
          });
          el += '</div>';
        }
      }
      if (args.group && args.group.length > 0) {
        if (args.group == groupId) {
          f();
        }
      } else {
        f();
      }
    }
  }
  el += '</div>';
  return el;
});
