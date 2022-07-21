console.log('hexo-theme-stellar:\n' + stellar.github);
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
    duration = isNaN(duration) ? 2000 : duration;
    var el = document.createElement('div');
    el.classList.add('toast');
    el.innerHTML = msg;
    document.body.appendChild(el);
    setTimeout(function () {
      var d = 0.5;
      el.style.webkitTransition = '-webkit-transform ' + d + 's ease-in, opacity ' + d + 's ease-in';
      el.style.opacity = '0';
      setTimeout(function () { document.body.removeChild(el) }, d * 1000);
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
    stellar.jQuery(() => {
      const scrollOffset = 32;
      var segs = [];
      $("article.md :header").each(function (idx, node) {
        segs.push(node)
      });
      // 滚动
      $(document, window).scroll(function (e) {
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
    stellar.jQuery(() => {
      $("#toc a.toc-link").click(function (e) {
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
  },
  /**
   * Tabs tag listener (without twitter bootstrap).
   */
  registerTabsTag: function () {
    // Binding `nav-tabs` & `tab-content` by real time permalink changing.
    document.querySelectorAll('.tabs ul.nav-tabs .tab').forEach(element => {
      element.addEventListener('click', event => {
        event.preventDefault();
        // Prevent selected tab to select again.
        if (element.classList.contains('active')) return;
        // Add & Remove active class on `nav-tabs` & `tab-content`.
        [...element.parentNode.children].forEach(target => {
          target.classList.toggle('active', target === element);
        });
        // https://stackoverflow.com/questions/20306204/using-queryselector-with-ids-that-are-numbers
        const tActive = document.getElementById(element.querySelector('a').getAttribute('href').replace('#', ''));
        [...tActive.parentNode.children].forEach(target => {
          target.classList.toggle('active', target === tActive);
        });
        // Trigger event
        tActive.dispatchEvent(new Event('tabs:click', {
          bubbles: true
        }));
      });
    });

    window.dispatchEvent(new Event('tabs:register'));
  },

}


// init
init.toc()
init.sidebar()
init.relativeDate(document.querySelectorAll('#post-meta time'))
init.registerTabsTag()

// scrollreveal
if (stellar.plugins.scrollreveal) {
  stellar.loadScript(stellar.plugins.scrollreveal.js).then(function () {
    ScrollReveal().reveal("body .reveal", {
      distance: stellar.plugins.scrollreveal.distance,
      duration: stellar.plugins.scrollreveal.duration,
      interval: stellar.plugins.scrollreveal.interval,
      scale: stellar.plugins.scrollreveal.scale,
      easing: "ease-out"
    });
  })
}

// lazyload
if (stellar.plugins.lazyload) {
  stellar.loadScript(stellar.plugins.lazyload.js, { defer: true })
  // https://www.npmjs.com/package/vanilla-lazyload
  // Set the options globally
  // to make LazyLoad self-initialize
  window.lazyLoadOptions = {
    elements_selector: ".lazy",
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
    stellar.jQuery(() => {
      stellar.loadScript(stellar.plugins.sitesjs, { defer: true })
    })
  }
}
if (stellar.plugins.friendsjs) {
  const issues_api = document.getElementById('friends-api');
  if (issues_api != undefined) {
    stellar.jQuery(() => {
      stellar.loadScript(stellar.plugins.friendsjs, { defer: true })
    })
  }
}

// swiper
if (stellar.plugins.swiper) {
  const swiper_api = document.getElementById('swiper-api');
  if (swiper_api != undefined) {
    stellar.loadCSS(stellar.plugins.swiper.css);
    stellar.loadScript(stellar.plugins.swiper.js, { defer: true }).then(function () {
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
    stellar.loadScript(stellar.plugins.preload.instant_page, {
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
    stellar.loadScript(stellar.plugins.preload.flying_pages, { defer: true })
  }
}

// fancybox
if (stellar.plugins.fancybox) {
  let selector = 'img[fancybox]:not(.error)';
  if (stellar.plugins.fancybox.selector) {
    selector += `, ${stellar.plugins.fancybox.selector}`
  }
  if (document.querySelectorAll(selector).length !== 0) {
    stellar.loadCSS(stellar.plugins.fancybox.css);
    stellar.loadScript(stellar.plugins.fancybox.js, { defer: true }).then(function () {
      Fancybox.bind(selector, {
        groupAll: true,
        hideScrollbar: false,
        Thumbs: {
          autoStart: false,
        },
        caption: function (fancybox, carousel, slide) {
          return slide.$trigger.alt || null
        }
      });
    })
  }
}

// heti
if (stellar.plugins.heti) {
  stellar.loadCSS(stellar.plugins.heti.css);
  stellar.loadScript(stellar.plugins.heti.js, { defer: true }).then(function () {
    const heti = new Heti('.heti');
    
    // Copied from heti.autoSpacing() without DOMContentLoaded.
    // https://github.com/sivan/heti/blob/eadee6a3b748b3b7924a9e7d5b395d4bce479c9a/js/heti-addon.js
    //
    // We managed to minimize the code modification to ensure .autoSpacing()
    // is synced with upstream; therefore, we use `.bind()` to emulate the 
    // behavior of .autoSpacing() so we can even modify almost no code.
    void (function () {
      const $$rootList = document.querySelectorAll(this.rootSelector)

      for (let $$root of $$rootList) {
        this.spacingElement($$root)
      }
    }).bind(heti)();

    stellar.plugins.heti.enable = false;
  });
}
