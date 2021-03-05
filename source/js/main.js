// utils
const util = {

  // https://github.com/jerryc127/hexo-theme-butterfly
  diffDate: (d, more = false) => {
    const dateNow = new Date()
    const datePost = new Date(d)
    const dateDiff = dateNow.getTime() - datePost.getTime()
    const minute = 1000 * 60
    const hour = minute * 60
    const day = hour * 24
    const month = day * 30

    let result
    if (more) {
      const monthCount = dateDiff / month
      const dayCount = dateDiff / day
      const hourCount = dateDiff / hour
      const minuteCount = dateDiff / minute

      if (monthCount > 12) {
        result = null
      } else if (monthCount >= 1) {
        result = parseInt(monthCount) + ' ' + stellar.config.date_suffix.month
      } else if (dayCount >= 1) {
        result = parseInt(dayCount) + ' ' + stellar.config.date_suffix.day
      } else if (hourCount >= 1) {
        result = parseInt(hourCount) + ' ' + stellar.config.date_suffix.hour
      } else if (minuteCount >= 1) {
        result = parseInt(minuteCount) + ' ' + stellar.config.date_suffix.min
      } else {
        result = stellar.config.date_suffix.just
      }
    } else {
      result = parseInt(dateDiff / day)
    }
    return result
  },

  // 懒加载 css https://github.com/filamentgroup/loadCSS
  loadCSS: (href, before, media, attributes) => {
    var doc = window.document;
    var ss = doc.createElement("link");
    var ref;
    if (before) {
      ref = before;
    } else {
      var refs = (doc.body || doc.getElementsByTagName("head")[0]).childNodes;
      ref = refs[refs.length - 1];
    }
    var sheets = doc.styleSheets;
    if (attributes) {
      for (var attributeName in attributes) {
        if (attributes.hasOwnProperty(attributeName)) {
          ss.setAttribute(attributeName, attributes[attributeName]);
        }
      }
    }
    ss.rel = "stylesheet";
    ss.href = href;
    ss.media = "only x";
    function ready(cb) {
      if (doc.body) {
        return cb();
      }
      setTimeout(function () {
        ready(cb);
      });
    }
    ready(function () {
      ref.parentNode.insertBefore(ss, before ? ref : ref.nextSibling);
    });
    var onloadcssdefined = function (cb) {
      var resolvedHref = ss.href;
      var i = sheets.length;
      while (i--) {
        if (sheets[i].href === resolvedHref) {
          return cb();
        }
      }
      setTimeout(function () {
        onloadcssdefined(cb);
      });
    };
    function loadCB() {
      if (ss.addEventListener) {
        ss.removeEventListener("load", loadCB);
      }
      ss.media = media || "all";
    }
    if (ss.addEventListener) {
      ss.addEventListener("load", loadCB);
    }
    ss.onloadcssdefined = onloadcssdefined;
    onloadcssdefined(loadCB);
    return ss;
  },

  // 从 butterfly 和 volantis 获得灵感
  loadScript: (src, opt) => new Promise((resolve, reject) => {
    var script = document.createElement('script')
    script.src = src
    if (opt) {
      for (let key of Object.keys(opt)) {
        script[key] = opt[key]
      }
    } else {
      // 默认异步，如果需要同步，第二个参数传入 {} 即可
      script.async = true
    }
    script.onerror = reject
    script.onload = script.onreadystatechange = function() {
      const loadState = this.readyState
      if (loadState && loadState !== 'loaded' && loadState !== 'complete') return
      script.onload = script.onreadystatechange = null
      resolve()
    }
    document.head.appendChild(script)
  }),

  // https://github.com/jerryc127/hexo-theme-butterfly
  jQuery: (fn) => {
    if (typeof jQuery === 'undefined') {
      util.loadScript(stellar.plugins.jQuery).then(fn)
    } else {
      fn()
    }
  },

  copy: (id, msg) => {
    const el = document.getElementById(id);
    if (el) {
      el.select();
      document.execCommand("Copy");
      if (msg && msg.length > 0) {
        hud.toast(msg);
      }
    }
  },

  toggle: (id) => {
    const el = document.getElementById(id);
    if (el) {
      el.classList.toggle("display");
    }
  },
}

const hud = {
  toast: (msg, duration) => {
    duration=isNaN(duration)?2000:duration;
    var el = document.createElement('div');
    el.classList.add('toast');
    el.innerHTML = msg;
    document.body.appendChild(el);
    setTimeout(function() {
      var d = 0.5;
      el.style.webkitTransition = '-webkit-transform ' + d + 's ease-in, opacity ' + d + 's ease-in';
      el.style.opacity = '0';
      setTimeout(function() { document.body.removeChild(el) }, d * 1000);
    }, duration);
  },

}

// defines

const l_body = document.querySelector('.l_body');

const sidebar = {
  toggle: () => {
    if (l_body) {
      l_body.classList.add('mobile');
      l_body.classList.toggle("sidebar");
    }
  }
}

const init = {
  toc: () => {
    util.jQuery(() => {
      const scrollOffset = 32;
      var segs = [];
      $("article.md :header").each(function (idx, node) {
        segs.push(node)
      });
      // 滚动
      $(document, window).scroll(function(e) {
        var scrollTop = $(this).scrollTop();
        var topSeg = null
        for (var idx in segs) {
          var seg = $(segs[idx])
          if (seg.offset().top > scrollTop + scrollOffset) {
            continue
          }
          if (!topSeg) {
            topSeg = seg
          } else if (seg.offset().top >= topSeg.offset().top) {
            topSeg = seg
          }
        }
        if (topSeg) {
          $("#toc a.toc-link").removeClass("active")
          var link = "#" + topSeg.attr("id")
          if (link != '#undefined') {
            $('#toc a.toc-link[href="' + encodeURI(link) + '"]').addClass("active")
          } else {
            $('#toc a.toc-link:first').addClass("active")
          }
        }
      })
    })
  },
  sidebar: () => {
    util.jQuery(() => {
      $("#toc a.toc-link").click(function(e) {
        l_body.classList.remove("sidebar");
      });
      $("#toc a#s-top").click(function(e) {
        l_body.classList.remove("sidebar");
      });
    })
  },
  relativeDate: (selector) => {
    selector.forEach(item => {
      const $this = item
      const timeVal = $this.getAttribute('datetime')
      let relativeValue = util.diffDate(timeVal, true)
      if (relativeValue) {
        $this.innerText = relativeValue
      }
    })
  }
}


// init
init.toc()
init.sidebar()
init.relativeDate(document.querySelectorAll('#post-meta time'))


// scrollreveal
if (stellar.plugins.scrollreveal) {
  util.loadScript(stellar.plugins.scrollreveal.js).then(function () {
    ScrollReveal().reveal("body .reveal", {
      distance: stellar.plugins.scrollreveal.distance,
      duration: stellar.plugins.scrollreveal.duration,
      interval: stellar.plugins.scrollreveal.interval,
      scale: stellar.plugins.scrollreveal.scale,
      easing: "ease-out",
    });
  })
}

// lazyload
if (stellar.plugins.lazyload) {
  util.loadScript(stellar.plugins.lazyload.js, {defer:true})
  // https://www.npmjs.com/package/vanilla-lazyload
  // Set the options globally
  // to make LazyLoad self-initialize
  window.lazyLoadOptions = {
    elements_selector: ".lazy",
    threshold: 0
  };
  // Listen to the initialization event
  // and get the instance of LazyLoad
  window.addEventListener(
    "LazyLoad::Initialized",
    function (event) {
      window.lazyLoadInstance = event.detail.instance;
    },
    false
  );
  document.addEventListener('DOMContentLoaded', function () {
    lazyLoadInstance.update();
  });
}

// issuesjs
if (stellar.plugins.sitesjs) {
  const issues_api = document.getElementById('sites-api');
  if (issues_api != undefined) {
    util.jQuery( () => {
      util.loadScript(stellar.plugins.sitesjs, {defer:true})
    })
  }
}
if (stellar.plugins.friendsjs) {
  const issues_api = document.getElementById('friends-api');
  if (issues_api != undefined) {
    util.jQuery( () => {
      util.loadScript(stellar.plugins.friendsjs, {defer:true})
    })
  }
}

// swiper
if (stellar.plugins.swiper) {
  const swiper_api = document.getElementById('swiper-api');
  if (swiper_api != undefined) {
    util.loadCSS(stellar.plugins.swiper.css);
    util.loadScript(stellar.plugins.swiper.js, {defer:true}).then(function () {
      var swiper = new Swiper('.swiper-container', {
        slidesPerView: 'auto',
        spaceBetween: 8,
        centeredSlides: true,
        loop: true,
        pagination: {
          el: '.swiper-pagination',
          clickable: true,
        },
        navigation: {
          nextEl: '.swiper-button-next',
          prevEl: '.swiper-button-prev',
        },
      });
    })
  }
}

// preload
if (stellar.plugins.preload) {
  if (stellar.plugins.preload.service == 'instant_page') {
    util.loadScript(stellar.plugins.preload.instant_page, {
      defer: true,
      type: 'module',
      integrity: 'sha384-OeDn4XE77tdHo8pGtE1apMPmAipjoxUQ++eeJa6EtJCfHlvijigWiJpD7VDPWXV1'
    })
  } else if (stellar.plugins.preload.service == 'flying_pages') {
    window.FPConfig = {
      delay: 0,
      ignoreKeywords: [],
      maxRPS: 5,
      hoverDelay: 25
    };
    util.loadScript(stellar.plugins.preload.flying_pages, {defer:true})
  }
}

console.log('hexo-theme-stellar:\n' + stellar.github);
