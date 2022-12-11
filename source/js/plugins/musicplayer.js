// 网易云音乐
// 要确保引入了https://unpkg.com/flyio/dist/umd/fly.umd.min.js文件
console.log("stellar-musicplayer");
var fly=new Fly();
url_base = stellar.plugins.musicplayer.netease

const NeteaseMusicAPI = {
  download_lyric: async(id) => {
    console.log('Downloading lyric...', id)    
    url = url_base + "/lyric"
    params = {
        'id':id
    }
    // 成功的回调函数
    function download_lyric_success(result) {
      console.log("Downloaded successfully.");
      return result;
    }
    
    // 失败的回调函数
    function download_lyric_fail(error) {
      console.log("Failed to download." + error);
    }
    
    let result = fly.request(url, params).then(download_lyric_success,download_lyric_fail);
    let data = await result.then((result) => {return result['data']['lrc']['lyric']});
    return data;
  },
  download_song_detail: async(id) => {
    url = url_base + "/song/detail"
    params = {
        'ids':id
    }

    let result = fly.request(url, params).then(
      (result) => {
        console.log("Downloaded successfully.");
        console.log(result['data']['songs'][0]['name']);
        console.log(result['data']['songs'][0]['ar'][0]['name']);
        console.log(result['data']['songs'][0]['al']['picUrl']);
        var details = {};
        details['name'] = result['data']['songs'][0]['name'];
        details['singer'] = result['data']['songs'][0]['ar'][0]['name'];
        details['pic'] = result['data']['songs'][0]['al']['picUrl'];
        return details;
      },
      (error) => {
        console.log("Failed to download. The error is : " + error);
        return result;
      });
    return result;
  },
  download_song_url: (id, level = 'standard') => {
    url = url_base + "/song/url/v1"
    params = {
        'id'    : id,
        'level' : level
    }

    let result = fly.request(url, params).then(
      (result) => {
        console.log("Downloaded successfully.");
        url = result['data']['data'][0]['url'];
        // 删除 https:// 或者 http://
        url = url.replace(/^(http):/, 'https:');
        console.log(url);
        return url;
      },
      (error) => {
        console.log("Failed to download. The error is : " + error);
        return result;
      });
    return result;
  },
  layoutDiv: async(cfg) => {
    var audio = [];
    // BUG ：此处需要考虑逗号两边有空格的情况
    var id_list = cfg.song_id.split(',');
    for (var i = 0; i < id_list.length; i++) {
      var id = id_list[i];
      // WARN：资源是异步获取的
      var lyric = NeteaseMusicAPI.download_lyric(id);
      var detail = NeteaseMusicAPI.download_song_detail(id);
      var url = NeteaseMusicAPI.download_song_url(id);
      var single_song = {};
      // WARN：获取了资源链接以后才能使用aplayer
      var details = await detail;
      single_song['name'] = details['name'];
      single_song['artist'] = details['singer'];
      single_song['cover'] = details['pic'];
      single_song['url'] = await url;
      single_song['lrc'] = await lyric;
      audio.push(single_song);
    }
    const ap = new APlayer({
      container: document.getElementById(cfg.id),
      mini: false,
      fixed: false,
      autoplay: true,
      theme: '#0899c4',
      loop: 'all',
      order: 'random',
      preload: 'auto',
      volume: 0.7,
      mutex: true,
      listFolded: true,
      listMaxHeight: 90,
      lrcType: 1,
      audio: audio
    });
  },
  layoutDiv_local: async(cfg) => {
    var audio = [];
    var els = cfg.el.getElementsByTagName('div');
    for (var i = 0; i < els.length; i++) {
      const el = els[i];
      var single_song = {};
      single_song['name'] = el.getAttribute('name');
      single_song['artist'] = el.getAttribute('artist');
      single_song['cover'] = el.getAttribute('cover');
      single_song['url'] = el.getAttribute('url');
      single_song['lrc'] = el.getAttribute('lrc');
      audio.push(single_song);
    }
    const ap = new APlayer({
      container: document.getElementById(cfg.id),
      mini: false,
      fixed: false,
      autoplay: true,
      theme: '#0899c4',
      loop: 'all',
      order: 'random',
      preload: 'auto',
      volume: 0.7,
      mutex: true,
      listFolded: true,
      listMaxHeight: 90,
      lrcType: 3,
      audio: audio
    });
  }
}

// <div class='stellar-musicplayer' song_id='436147423'>
$(function () {
  const els = document.getElementsByClassName('stellar-musicplayer');
  console.log("number of players : ",els.length);

  for (var i = 0; i < els.length; i++) {
    const el = els[i];

    const song_id = el.getAttribute('song_id');
    const id = el.getAttribute('id');
    const from = el.getAttribute('from');

    if (id == null) {
      console.log("no id");
      continue;
    }
    if (from == 'local') {
      var cfg = new Object();
      cfg.id = id;
      cfg.el = el;
      cfg.song_id = song_id;
      NeteaseMusicAPI.layoutDiv_local(cfg);
    } else if (from == 'netease') {
      if (song_id == null) {
        console.log("need song_id to fetch remote resources.");
        continue;
      }
      var cfg = new Object();
      cfg.id = id;
      cfg.el = el;
      cfg.song_id = song_id;
      NeteaseMusicAPI.layoutDiv(cfg);
    }
  }
});



