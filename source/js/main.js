console.log('\n' + '%c Stellar v' + stellar.version + ' %c\n' + stellar.github + '\n', 'color:#e8fafe;background:#03c7fa;padding:8px;border-radius:4px', 'margin-top:8px');
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
        hud.toast(msg, 2500);
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
    const d = Number(isNaN(duration) ? 2000 : duration);
    var el = document.createElement('div');
    el.classList.add('toast');
    el.classList.add('show');
    el.innerHTML = msg;
    document.body.appendChild(el);

    setTimeout(function(){ document.body.removeChild(el) }, d);
    
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
      $("article.md-text :header").each(function (idx, node) {
        segs.push(node)
      });
      // 定位到激活的目录树（不如pjax体验好）
      // const widgets = document.querySelector('.widgets')
      // const e1 = document.querySelector('.doc-tree-link.active')
      // const offsetTop = e1.getBoundingClientRect().top - widgets.getBoundingClientRect().top - 100
      // if (offsetTop > 0) {
      //   widgets.scrollBy({top: offsetTop, behavior: 'smooth'})
      // }
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
          $("#data-toc a.toc-link").removeClass("active")
          var link = "#" + topSeg.attr("id")
          if (link != '#undefined') {
            const highlightItem = $('#data-toc a.toc-link[href="' + encodeURI(link) + '"]')
            if (highlightItem.length > 0) {
              highlightItem.addClass("active")
              const e0 = document.querySelector('.widgets')
              const e1 = document.querySelector('#data-toc a.toc-link[href="' + encodeURI(link) + '"]')
              const offsetBottom = e1.getBoundingClientRect().bottom - e0.getBoundingClientRect().bottom + 200
              const offsetTop = e1.getBoundingClientRect().top - e0.getBoundingClientRect().top - 64
              if (offsetTop < 0) {
                e0.scrollBy(0, offsetTop)
              } else if (offsetBottom > 0) {
                e0.scrollBy(0, offsetBottom)
              }
            }
          } else {
            $('#data-toc a.toc-link:first').addClass("active")
          }
        }
      })
    })
  },
  sidebar: () => {
    stellar.jQuery(() => {
      $("#data-toc a.toc-link").click(function (e) {
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
    document.querySelectorAll('.tabs .nav-tabs .tab').forEach(element => {
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
    const slideUp = {
      distance: stellar.plugins.scrollreveal.distance,
      duration: stellar.plugins.scrollreveal.duration,
      interval: stellar.plugins.scrollreveal.interval,
      scale: stellar.plugins.scrollreveal.scale,
      opacity: 0,
      easing: "ease-out"
    }
    ScrollReveal().reveal('.l_left .slide-up', slideUp)
    ScrollReveal().reveal('.l_main .slide-up', slideUp)
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
    window.lazyLoadInstance?.update();
  });
}

// stellar js
if (stellar.plugins.stellar) {
  for (let key of Object.keys(stellar.plugins.stellar)) {
    let js = stellar.plugins.stellar[key];
    if (key == 'linkcard') {
      stellar.loadScript(js, { defer: true }).then(function () {
        setCardLink(document.querySelectorAll('a.link-card[cardlink]'));
      });
    } else {
      const els = document.getElementsByClassName('stellar-' + key + '-api');
      if (els != undefined && els.length > 0) {
        stellar.jQuery(() => {
          if (key == 'timeline' || 'memos' || 'marked') {
            stellar.loadScript(stellar.plugins.marked).then(function () {
              stellar.loadScript(js, { defer: true });
            });
          } else {
            stellar.loadScript(js, { defer: true });
          }
        })
      }
    }
  }
}

// swiper
if (stellar.plugins.swiper) {
  const swiper_api = document.getElementById('swiper-api');
  if (swiper_api != undefined) {
    stellar.loadCSS(stellar.plugins.swiper.css);
    stellar.loadScript(stellar.plugins.swiper.js, { defer: true }).then(function () {
      const effect = swiper_api.getAttribute('effect') || '';
      var swiper = new Swiper('.swiper#swiper-api', {
        slidesPerView: 'auto',
        spaceBetween: 8,
        centeredSlides: true,
        effect: effect,
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

function loadFancybox() {
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
// fancybox
if (stellar.plugins.fancybox) {
  let selector = 'img[fancybox]:not(.error)';
  if (stellar.plugins.fancybox.selector) {
    selector += `, ${stellar.plugins.fancybox.selector}`
  }
  var needFancybox = document.querySelectorAll(selector).length !== 0;
  if (!needFancybox) {
    const els = document.getElementsByClassName('stellar-memos-api');
    if (els != undefined && els.length > 0) {
      needFancybox = true;
    }
  }
  if (needFancybox) {
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


if (stellar.search.service) {
  if (stellar.search.service == 'local_search') {
    stellar.jQuery(() => {
      stellar.loadScript('/js/search/local-search.js', { defer: true }).then(function () {
        var $inputArea = $("input#search-input");
        if ($inputArea.length == 0) {
          return;
        }
        var $resultArea = document.querySelector("div#search-result");
        $inputArea.focus(function() {
          var path = stellar.search[stellar.search.service]?.path || '/search.json';
          if (path.startsWith('/')) {
            path = path.substring(1);
          }
          path = stellar.config.root + path;
          const filter = $inputArea.attr('data-filter') || '';
          searchFunc(path, filter, 'search-wrapper', 'search-input', 'search-result');
        });
        $inputArea.keydown(function(e) {
          if (e.which == 13) {
            e.preventDefault();
          }
        });
        var observer = new MutationObserver(function(mutationsList, observer) {
          if (mutationsList.length == 1) {
            if (mutationsList[0].addedNodes.length) {
              $('.search-wrapper').removeClass('noresult');
            } else if (mutationsList[0].removedNodes.length) {
              $('.search-wrapper').addClass('noresult');
            }
          }
        });
        observer.observe($resultArea, { childList: true });
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

if (stellar.plugins.copycode) {
  stellar.loadScript(stellar.plugins.copycode.js, { defer: true })
}