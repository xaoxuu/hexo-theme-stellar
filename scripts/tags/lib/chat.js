/**
 * chat.js v1.1 | https://github.com/HcGys/stellar/
 * 格式与官方标签插件一致使用空格分隔，中括号内的是可选参数（中括号不需要写出来）
 *
 * 
 * chat:
 * {% chat device [style:wechat/qq 默认qq] [title:导航栏标题可选] [scene:group|person 默认group] [me:user1] [labelColorStyle: hand | dynamic] %}
 * 
 *  user1:
 *    name:
 *    avatar: 
 *    label:
 *      text: 群主
 *      textColor: white
 *      bgColor: #2196f3
 * 
 * <!-- chattip 2024年5月22日 21:43 -->
 * <!-- chatcell user:user1 md:你好 tag:1 --> // 文字消息，默认靠左布局
 * <!-- chatcell user:user2 md:Are U OK quote:1 --> // 文字消息
 * <!-- chatcell user:user3 image:src --> // 图片消息（默认支持fancybox）
 * <!-- chatcell user:user3 emoji:xxx source:xxx --> // 表情包消息（这里用的是emoji组件的资源，标准emoji的话直接输入就行）
 * <!-- chatcell user:user1 voice:src type:mp3 --> // 语音消息（可播放）
 * <!-- chatcell user:user1 video:src type:mp3 --> // 视频消息（可播放）
 * <!-- chatcell user:user1 link:href from:百度浏览器 --> // 链接卡片消息（可点击跳转）
 * <!-- chatcell user:user1 file:href --> // 文件消息（可下载）
 * {% endchat %}
 *
 */

'use strict'

var chatIndex = 0;

module.exports = ctx => function(args, content) {
  function isObject(item) {
    return item && typeof item === 'object' && !Array.isArray(item);
  }

  function merge(target, source) {
    for (const key in source) {
      if (isObject(target[key]) && isObject(source[key])) {
        merge(target[key], source[key]);
      } else {
        target[key] = source[key];
      }
    }
    return target;
  }

  args = ctx.args.map(args, ['style', 'title', 'scene', 'me', 'labelColorStyle'], ['device'])

  // users
  var arr = content.split(/<!--\s*([\s\S]*?)\s*-->/g).filter(item => item.trim().length > 0)
  if (arr.length > 0) {
    // 避免用户在没有配置chat_users.yaml时出错
    if (ctx.theme.config.chat_users){
      var users = merge(ctx.theme.config.chat_users, ctx.render.renderSync({ text: (arr[0] || ''), engine: 'yaml' }));
    }
    var users = ctx.render.renderSync({ text: (arr[0] || ''), engine: 'yaml' });
  }


  // 参数
  const parmsDict = {
    "common": ["user", "tag"],
    "md"    : ["md", "quote"],
    "image" : ["image"],
    "emoji" : ["emoji", "source"],
    "voice" : ["voice", "type"],
    "video" : ["video"],
    "link"  : ["link", "from"],
    "file"  : ["file"],
  };
  var parmsSet = new Set();
  Object.keys(parmsDict).forEach(key => {
    parmsDict[key].forEach(parm => {
      parmsSet.add(parm);
    });
  });
  var parmsReg = new RegExp(`\\s*(${[...parmsSet].join("|")}):([\s\S]*?)\\s*`, 'g');  // /\s*(user|md|image|emoji|source|voice|type|video|link|from|file):(.*?)\s*/g

  var chatcellNum = 0
  var cells = []
  var tagCells = {}
  arr = content.match(/<!--\s*([\s\S]*?)\s*-->/g).filter(item => item.trim().length > 0)
  arr.forEach(cell => {
    var cellContent = cell.split(/<!--\s*(chattip|chatcell) ([\s\S]*?)\s*-->/g).filter(item => item.trim().length > 0)
    // console.log(cellContent)
    var dic = {}
    if (cellContent[0] && cellContent[0] == 'chattip') {
      dic['identifier'] = 'chattip'
      dic['content'] = cellContent[1]
    } else if (cellContent[0] && cellContent[0] == 'chatcell') {
      dic['identifier'] = 'chatcell'
      var parms = cellContent[1].split(parmsReg).filter(item => item.trim().length > 0)
      // console.log(parms)
      var hasTag = false
      var tag = ""
      for (let i = 0; i < parms.length; ++i) {
        dic[parms[i]] = parms[i + 1]
        if (parms[i] == 'tag') {
          hasTag = true
          tag = parms[i + 1]
        }
        i++
      }
      chatcellNum++;
      if (hasTag) tagCells[tag] = dic
    }
    cells.push(dic)
  })
  // console.log(cells)
  // console.log(tagCells)

  function loadIcon(url) {
    var el = ''
    el += '<div class="lazy img" data-bg="' + ctx.theme.config.default.link + '"></div>'
    return el
  }

  function getFileType(filePath) {
    let splitedFilePath = filePath.split(".");
    if (splitedFilePath.length <= 1) {
      return "unknow";
    }
    let typeMark = splitedFilePath[splitedFilePath.length - 1];
    if (["doc", "docx"].includes(typeMark)) {
      return "word";
    } else if (["ppt", "pptx"].includes(typeMark)) {
      return "ppt";
    } else if (["csv", "xls", "xlsx"].includes(typeMark)) {
      return "excel";
    } else if (typeMark == "pdf") {
      return "pdf";
    } else if (["txt", "md"].includes(typeMark)) {
      return "txt";
    } else if (["tar", "rar", "zip", "Z", "gz", "bz2", "xz", "7z"].includes(typeMark)) {
      return "compressPkg";
    } else if (["java", "c", "cpp", "py", "h", "js", "html", "css", "sql", "php"].includes(typeMark)) {
      return "code";
    }  else if (["mp4", "mov", "avi", "flv", "asf", "wmv"].includes(typeMark)) {
      return "video";
    } else if (["jpg", "png", "webp", "jpeg", "svg", "gif"].includes(typeMark)) {
      return "photo";
    } else if (["mp3", "wma", "rm", "wav", "midi", "ape", "flac"].includes(typeMark)) {
      return "voice";
    } else if (["ini", "conf", "config", "xml", "yaml", "toml", "json", "yml", "plist"].includes(typeMark)) {
      return "config";
    } else if (["mdb", "mdf", "myd", "db", "dbf", "wdb", "sqlite"].includes(typeMark)) {
      return "database";
    } else if (["max", "obj", "stp", "stl", "dae", "fbx", "x3d"].includes(typeMark)) {
      return "3d";
    }  else if (["exe", "bat", "app", "sh", "so", "cmd", "command"].includes(typeMark)) {
      return "exe";
    } else if (["lnk"].includes(typeMark)) {
      return "link";
    } else {
      return "unknow";
    }
  }

  const linkFromDic = {
    'Google浏览器': ctx.utils.icon('chat:google'),
    'Safari浏览器': ctx.utils.icon('chat:safari'),
    'IE浏览器': ctx.utils.icon('chat:ie'),
    'UC浏览器': ctx.utils.icon('chat:uc'),
    'QQ浏览器': ctx.utils.icon('chat:qq'),
    '百度浏览器': ctx.utils.icon('chat:baidu'),
    'Firefox浏览器': ctx.utils.icon('chat:firefox'),
    '360浏览器': ctx.utils.icon('chat:360'),
    'QQ小程序': ctx.utils.icon('chat:qq-mini'),
  }

  const fileTypeDic = {
    'word': ctx.utils.icon('chat:file-word'),
    'ppt': ctx.utils.icon('chat:file-ppt'),
    'txt': ctx.utils.icon('chat:file-txt'),
    'pdf': ctx.utils.icon('chat:file-pdf'),
    'unknow': ctx.utils.icon('chat:file-unknown'),
    'compressPkg': ctx.utils.icon('chat:file-archive'),
    'excel': ctx.utils.icon('chat:file-excel'),
    'code': ctx.utils.icon('chat:file-code'),
    'photo': ctx.utils.icon('chat:file-photo'),
    'video': ctx.utils.icon('chat:file-video'),
    'voice': ctx.utils.icon('chat:file-voice'),
    'config': ctx.utils.icon('chat:file-config'),
    'database': ctx.utils.icon('chat:file-database'),
    'link': ctx.utils.icon('chat:file-link'),
    'exe': ctx.utils.icon('chat:file-exe'),
    '3d': ctx.utils.icon('chat:file-3d'),
  }

  var el = ''
  el += '<div class="tag-plugin chat'
  if (args.device) el += ' ' + args.device
  args.style = args.style ? args.style : 'qq'
  el += ' ' + args.style
  if (args.scene) el += ' ' + args.scene
  el += '">'

  if (!args.labelColorStyle || args.labelColorStyle == 'dynamic') {
    const dynamic_color = ctx.extend.helper.get("dynamic_color").bind(ctx)
    let userlabelColors = {};
    cells.forEach(cell => {
      if (cell['identifier'] === 'chatcell') {
        var user = users[cell['user']]
        if (user && user.label && user.label.bgColor) {
          userlabelColors[cell['user']] = user.label.bgColor
        }
      }
    });
    let styles_light = '';
    let styles_dark = '';
    let styles_hover = '';
    let index = 0;
    var userColorMap = {};
    Object.entries(userlabelColors).forEach(([user, color]) => {
      let {style_light, style_dark, style_hover} = dynamic_color(color, index, 'chat-' + chatIndex);
      styles_light += style_light;
      styles_dark += style_dark;
      styles_hover += style_hover;
      userColorMap[user] = index;
      index++;
    });
    // console.log(userColorMap)
    let style_str =  `:root {${styles_light}}@media (prefers-color-scheme: dark) {:root:not([color-scheme]) {${styles_dark}}}[color-scheme='dark']{${styles_dark}}`;
    el += `<style id="chat-${chatIndex}">${style_str}</style>`
  }

  if (args.device) {
    el += `
    <div class="device-image"></div>
    <div class="status-bar">
      <div class="left-items">
        <span class="time">14:36</span>
      </div>
      <div class="right-items">
        ${ctx.utils.icon('chat:earphone')}
        ${ctx.utils.icon('chat:bluetooth')}
        ${ctx.utils.icon('chat:signal')}
        ${ctx.utils.icon('chat:wifi')}
        ${ctx.utils.icon('chat:battery')}
      </div>
    </div>
    `
  }

  el += `
  <div class="chat-navbar">
    <div class="left-items">
      <div class="back-btn">
        ${ctx.utils.icon('chat:back')}
      </div>
      <div class="news-num">${chatcellNum}</div>
      <div class="title">${args.title}</div>
    </div>
    <div class="right-items">
      <div class="more-btn">
        ${args.style == 'wechat' ? 
          ctx.utils.icon('chat:nav-more-wechat')
           : 
          ctx.utils.icon('chat:nav-more-qq')
        }
      </div>
    </div>
  </div>
  `

  el += '<div class="content">'
  cells.forEach(cell => {
    if (cell['identifier'] === 'chattip') {
      el += '<div class="chattip">'
      el += cell['content']
      el += '</div>'
    } else if (cell['identifier'] === 'chatcell') {
      var user = users[cell['user']]
      // console.log(user)

      el += '<div class="chatcell'
      if (args.me && args.me === cell['user']) {
        el += ' right'
      }

      el += `"${cell['tag'] ? ' id="quote-' + cell['tag'] + '"' : ''}>`

      el += '<div class="user-avatar"><img lazy src="'
      el += user['avatar']
      el += '"></div>'

      el += '<div class="user-main">'

      el += '<div class="header">'
      // 防止徽章为空
      if (user['label']){
        if (!args.labelColorStyle || args.labelColorStyle == 'dynamic') {
          el += `<span class="label dynamic-color" style="color:var(--chat-${chatIndex}-label-text-color-${userColorMap[cell['user']]});background:var(--chat-${chatIndex}-label-bg-${userColorMap[cell['user']]});">`
        } else {
          el += `<span class="label hand-color" style="color:${user['label']['textColor']};background:${user['label']['bgColor']};">`
        }
        el += user['label']['text']
        el += '</span>'
      }
      el += '<span class="name">'
      el += user['name']
      el += '</span>'
      el += '</div>'  // header

      el += '<div class="talk'
      if (cell['md']) {
        el += ' md">'
        if (cell['quote'] && args.style == 'qq') {
          var quotedCell = tagCells[cell['quote']]
          var quotedUser = users[quotedCell['user']]
          if (quotedCell['md']) {
            el += `
              <div class="quote" quotedCellTag="${cell['quote']}">
                <div class="quote-user">
                  <span>${quotedUser['name']}</span>
                  ${ctx.utils.icon('chat:arrow-up')}
                </div>
                <div class="quote-content">
                  <span>${ctx.render.renderSync({text: quotedCell['md'], engine: 'markdown'}).split('\n').join('')}</span>
                </div>
              </div>
            `
          } else if (quotedCell['image']) {
            el += `
              <div class="quote" quotedCellTag="${cell['quote']}">
                <div class="quote-user">
                  <span>${quotedUser['name']}</span>
                  ${ctx.utils.icon('chat:arrow-up')}
                </div>
                <div class="quote-content">
                  <img lazy src="${quotedCell['image']}">
                </div>
              </div>
            `
          }
          el += ctx.render.renderSync({text: `@${quotedUser['name']} ` + cell['md'], engine: 'markdown'}).split('\n').join('')
        } else {
          el += ctx.render.renderSync({text: cell['md'], engine: 'markdown'}).split('\n').join('')
        }
      } else if (cell['image']) {
          el += ' image">'
          el += `<img lazy fancybox="true" src="${cell['image']}">`
      } else if (cell['emoji']) {
          el += ' emoji">'
          const config = ctx.theme.config.tag_plugins.emoji
          if (cell['source'] === undefined) {
            for (let id in config) {
              if (config[id]) {
                cell['source'] = id
                break
              }
            }
          }
          if (cell['source'] && config[cell['source']]) {
            let url = config[cell['source']].replace('{name}', cell['emoji'])
            el += `<img lazy src="${url}">`
          } else {
            el += `<img lazy src="${cell['emoji']}">`
          }
      } else if (cell['voice']) {
        el += ' voice">'
        if (args.style == 'qq') {
          el +=`
            <div class="voice-btns">
              <div class="pause-btn" style="display:none;">
                ${ctx.utils.icon('chat:pause')}
              </div>
              <div class="play-btn" style="display:flex;">
                ${ctx.utils.icon('chat:play')}
              </div>
            </div>
            <canvas class="voice-wave${args.me && args.me === cell['user'] ? ' right' : ''}"></canvas>
            <audio class="${args.style}" preload="auto">
              <source src="${cell['voice']}" type="${cell['type'] || 'audio/mp3'}">Your browser does not support the audio in chat tag.
            </audio>
            <div class="voice-metas">
              <span class="voice-seconds"></span>
            </div>
          `
        } else if (args.style == 'wechat') {
          el += `
            <div class="wechat-voice">
                <div class="voice-circle first"></div>
                <div class="voice-circle second"></div>
                <div class="voice-circle third"></div>
            </div>
            <audio class="${args.style}" preload="auto">
              <source src="${cell['voice']}" type="${cell['type'] || 'audio/mp3'}">Your browser does not support the audio in chat tag.
            </audio>
            <div class="voice-metas">
              <span class="voice-seconds"></span>
            </div>
            <div class="voice-placeholder">
            </div>
          `
        }
      } else if (cell['video']) {
          el += ' video">'
          el += `
            <div class="video-btns">
              <div class="pause-btn" style="display:none;">
                ${ctx.utils.icon('chat:pause')}
              </div>
              <div class="play-btn" style="display:flex;">
                ${ctx.utils.icon('chat:play')}
              </div>
            </div>
            <video preload disablePictureInPicture>
            <source src="${cell['video']}" type="${cell['type'] || 'video/mp4'}">Your browser does not support the video tag.
            </video>
          `
      } else if (cell['link']) {
          el += ' link">'
          let urlTarget = cell['link'].includes('://') ? ' target="_blank" rel="external nofollow noopener noreferrer"' : ''
          let linkFrom = cell['from'] || 'QQ小程序'
          el += `
            <a class="link-card rich" href="${cell['link']}"${urlTarget} data-api="${ctx.theme.config.tag_plugins.chat?.api + '?url=' + cell['link']}" cardlink autofill="title,icon,desc">
            <div class="top">
              <span class="title">${cell['link']}</span>
            </div>
            <div class="center">
              <div class="left">
                <span class="cap desc fs12"></span>
              </div>
              <div class="right">
                ${loadIcon(cell['link'])}
              </div>
            </div>
            <div class="bottom">
              ${linkFromDic[linkFrom]}
              <span class="cap from fs12">&nbsp;${linkFrom}</span>
            </div>
            </a>
          `
      } else if (cell['file']) {
        el += ` chat-file" url="${cell["file"]}">`
        el += `
          <div class="content">
            <div class="top">
              <div class="left">
                <span>${cell["file"]}</span>
              </div>
              <div class="right">
                ${fileTypeDic[getFileType(cell["file"])]}
              </div>
            </div>
            <div class="bottom">
              <span class="desc cap fs12 file-size"></span>
            </div>
          </div>
          <div class="download-btn">
            ${ctx.utils.icon('chat:download')}
          </div>
        `
      } 
      el += '</div>'  // talk
      if (cell['md'] && cell['quote'] && args.style == 'wechat') {
        var quotedCell = tagCells[cell['quote']]
        var quotedUser = users[quotedCell['user']]
        if (quotedCell['md']) {
          el += `
            <div class="quote" quotedCellTag="${cell['quote']}">
              <div>${quotedUser['name']}:</div> 
              <div>${ctx.render.renderSync({text: quotedCell['md'], engine: 'markdown'}).split('\n').join('')}
              </div>
            </div>
          `
        } else if (quotedCell['image']) {
          el += `
            <div class="quote image-chat" quotedCellTag="${cell['quote']}">
              <span>${quotedUser['name']}: </span>
              <img lazy src="${quotedCell['image']}">
            </div>
          `
        }
      }
      el += '</div>'  // main
      el += '</div>'  // chatcell
    }
  })

  el += '</div>'  // content

  if (args.style == 'qq') {
    el += `
      <div class="bottom">
        <div class="input">
          <div class="input-text"></div>
          <div class="submit-btn">发送</div>
        </div>
        <div class="icons">
          ${ctx.utils.icon('chat:voice-qq')}
          ${ctx.utils.icon('chat:photos')}
          ${ctx.utils.icon('chat:camera')}
          ${ctx.utils.icon('chat:red-envelope')}
          ${ctx.utils.icon('chat:smile-qq')}
          ${ctx.utils.icon('chat:more-qq')}
        </div>
      </div>
    `
  } else if (args.style == 'wechat') {
    el += `
    <div class="bottom">
        ${ctx.utils.icon('chat:voice-wechat')}
        <div class="input-text"></div>
        ${ctx.utils.icon('chat:smile-wechat')}
        ${ctx.utils.icon('chat:more-wechat')}
    </div>
    `
  }

  el += '</div>'  // tag-plugin chat

  return el
}
