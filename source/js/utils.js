(function () {
  // 防重复执行：utils.js 可能被重复加载，二次执行直接跳过，避免重复声明报错。
  if (window.__stellarUtilsLoaded) return;
  window.__stellarUtilsLoaded = true;

  function RunItem() {
    this.list = []; // 存放回调函数
    this.start = () => {
      for (var i = 0; i < this.list.length; i++) {
        this.list[i].run();
      }
    };
    this.push = (fn, name, setRequestAnimationFrame = true) => {
      let myfn = fn
      if (setRequestAnimationFrame) {
        myfn = () => {
          utils.requestAnimationFrame(fn)
        }
      }
      var f = new Item(myfn, name);
      this.list.push(f);
    };
    this.remove = (name) => {
      // 倒序遍历避免 splice 后的索引问题
      for (let index = this.list.length - 1; index >= 0; index--) {
        const e = this.list[index];
        if (e.name === name) {
          this.list.splice(index, 1);
        }
      }
    }
    // 构造一个可以run的对象
    function Item(fn, name) {
      // 函数名称
      this.name = name || fn.name;
      // run方法
      this.run = () => {
        try {
          fn()
        } catch (error) {
          console.log(error);
        }
      };
    }
  }

  const utils = {
    // 已加载样式缓存
    _loadedStyles: new Set(),

    // 懒加载 css https://github.com/filamentgroup/loadCSS
    css: (href, before, media, attributes) => {
      // 如果样式已加载，直接返回 null
      if (utils._loadedStyles.has(href)) {
        return null;
      }
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
          if (Object.prototype.hasOwnProperty.call(attributes, attributeName)) {
            ss.setAttribute(attributeName, attributes[attributeName]);
          }
        }
      }
      ss.rel = "stylesheet";
      ss.href = href;
      ss.media = "only x";
      // 标记样式为已加载 (在创建元素后立即标记，防止重复创建)
      utils._loadedStyles.add(href);
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

    // 已加载脚本缓存
    _loadedScripts: new Set(),

    // 已加载元素缓存 (使用 WeakSet 追踪元素实例,避免重复加载)
    _loadedElements: new WeakSet(),

    js: (src, opt) => new Promise((resolve, reject) => {
      if (src.startsWith('/')) {
        src = ctx.root + src.substring(1);
      }
      // 如果脚本已加载，直接返回
      if (utils._loadedScripts.has(src)) {
        resolve();
        return;
      }
      var script = document.createElement('script');
      script.src = src;
      if (opt) {
        for (let key of Object.keys(opt)) {
          script[key] = opt[key]
        }
      } else {
        // 默认异步，如果需要同步，第二个参数传入 {} 即可
        script.async = true
      }
      script.onerror = reject
      script.onload = script.onreadystatechange = function () {
        const loadState = this.readyState
        if (loadState && loadState !== 'loaded' && loadState !== 'complete') return
        script.onload = script.onreadystatechange = null
        utils._loadedScripts.add(src);
        resolve()
      }
      document.head.appendChild(script)
    }),

    // 原生 DOM 工具：querySelector / querySelectorAll 简写
    qs: (sel, ctx) => (ctx || document).querySelector(sel),
    qsa: (sel, ctx) => Array.prototype.slice.call((ctx || document).querySelectorAll(sel)),

    // 原生 DOM 封装：常用 DOM 操作方法子集（find/append/class/attr/事件等）
    dom: (selector, ctx) => {
      var els = [];
      if (typeof selector === 'string') {
        els = utils.qsa(selector, ctx);
      } else if (selector && selector.nodeType === 1) {
        els = [selector];
      } else if (selector && typeof selector.length === 'number') {
        els = Array.prototype.slice.call(selector);
      }
      var api = {
        length: els.length,
        each: function (fn) {
          els.forEach(function (el, i) {
            fn.call(el, i, el);
          });
          return api;
        },
        find: function (sel) {
          var result = [];
          els.forEach(function (el) {
            Array.prototype.push.apply(result, el.querySelectorAll(sel));
          });
          return utils.dom(result);
        },
        append: function (content) {
          els.forEach(function (el) {
            if (typeof content === 'string') {
              el.insertAdjacentHTML('beforeend', content);
            } else if (content && content.nodeType === 1) {
              el.appendChild(content);
            } else if (content && typeof content.length === 'number') {
              Array.prototype.forEach.call(content, function (child) {
                if (child && child.nodeType === 1) el.appendChild(child);
              });
            }
          });
          return api;
        },
        remove: function () {
          els.forEach(function (el) {
            el.remove();
          });
        },
        addClass: function (cls) {
          els.forEach(function (el) {
            cls.trim().split(/\s+/).forEach(function (c) {
              if (c) el.classList.add(c);
            });
          });
          return api;
        },
        removeClass: function (cls) {
          els.forEach(function (el) {
            cls.trim().split(/\s+/).forEach(function (c) {
              if (c) el.classList.remove(c);
            });
          });
          return api;
        },
        toggleClass: function (cls, force) {
          els.forEach(function (el) {
            cls.trim().split(/\s+/).forEach(function (c) {
              if (c) el.classList.toggle(c, force);
            });
          });
          return api;
        },
        attr: function (name, value) {
          if (value === undefined) {
            return els[0] ? els[0].getAttribute(name) : undefined;
          }
          els.forEach(function (el) {
            el.setAttribute(name, value);
          });
          return api;
        },
        data: function (name) {
          return els[0] ? els[0].getAttribute('data-' + name) : undefined;
        },
        text: function (value) {
          if (value === undefined) {
            return els[0] ? els[0].textContent : undefined;
          }
          els.forEach(function (el) {
            el.textContent = value;
          });
          return api;
        },
        html: function (content) {
          if (content === undefined) {
            return els[0] ? els[0].innerHTML : undefined;
          }
          els.forEach(function (el) {
            if (typeof content !== 'string' && content && typeof content.length === 'number' && content[0] && content[0].nodeType === 1) {
              var frag = document.createDocumentFragment();
              Array.prototype.forEach.call(content, function (child) {
                frag.appendChild(child);
              });
              el.replaceChildren(frag);
            } else {
              el.innerHTML = content;
            }
          });
          return api;
        },
        val: function (value) {
          if (value === undefined) {
            return els[0] ? els[0].value : undefined;
          }
          els.forEach(function (el) {
            el.value = value;
          });
          return api;
        },
        offset: function () {
          var el = els[0];
          if (!el) return { top: 0, left: 0 };
          var rect = el.getBoundingClientRect();
          return { top: rect.top + window.scrollY, left: rect.left + window.scrollX };
        },
        on: function (event, cb) {
          els.forEach(function (el) {
            el.addEventListener(event, cb);
          });
          return api;
        },
        click: function (cb) { return api.on('click', cb); },
        focus: function (cb) { return api.on('focus', cb); },
        keydown: function (cb) { return api.on('keydown', cb); },
        empty: function () {
          els.forEach(function (el) {
            el.replaceChildren();
          });
          return api;
        }
      };
      els.forEach(function (el, i) {
        api[i] = el;
      });
      return api;
    },

    onLoading: (el) => {
      if (el) {
        if (el.querySelector('.loading-wrap') === null) {
          el.insertAdjacentHTML('beforeend', `<div class="loading-wrap"><div class="lazy-icon"></div></div>`);
        }
      }
    },
    onLoadSuccess: (el) => {
      if (el) {
        var wrap = el.querySelector('.loading-wrap');
        if (wrap) wrap.remove();
      }
    },
    onLoadFailure: (el) => {
      if (el) {
        var wrap = el.querySelector('.loading-wrap');
        if (wrap) {
          var svg = wrap.querySelector('svg');
          if (svg) svg.remove();
          wrap.insertAdjacentHTML('beforeend', ctx.icons['default:warning']);
          wrap.classList.add('error');
        }
      }
    },
    /********************** requestAnimationFrame ********************************/
    // 1、requestAnimationFrame 会把每一帧中的所有 DOM 操作集中起来，在一次重绘或回流中就完成，并且重绘或回流的时间间隔紧紧跟随浏览器的刷新频率，一般来说，这个频率为每秒60帧。
    // 2、在隐藏或不可见的元素中，requestAnimationFrame 将不会进行重绘或回流，这当然就意味着更少的的 cpu，gpu 和内存使用量。
    requestAnimationFrame: (fn) => {
      if (!window.requestAnimationFrame) {
        window.requestAnimationFrame = window.requestAnimationFrame || window.mozRequestAnimationFrame || window.webkitRequestAnimationFrame;
      }
      window.requestAnimationFrame(fn)
    },
    dark: {},
  };

  // utils.dark.mode 当前模式 dark or light
  // utils.dark.toggle() 暗黑模式触发器
  // utils.dark.push(callBack[,"callBackName"]) 传入触发器回调函数
  utils.dark.method = {
    toggle: new RunItem(),
  };
  utils.dark = Object.assign(utils.dark, {
    push: utils.dark.method.toggle.push,
  });

  // 自定义注入脚本可能在 type=module runtime 执行前调用 request；以 Promise 接缝排队，
  // runtime 安装真实 adapter 后统一放行，不在经典脚本中复制任何网络或缓存算法。
  var requestBridge = {};
  requestBridge.ready = new Promise(function (resolve) {
    requestBridge.resolve = resolve;
  });
  utils.request = function () {
    var args = arguments;
    return requestBridge.ready.then(function (adapter) {
      return adapter.request.apply(null, args);
    });
  };
  utils.requestWithoutLoading = function () {
    var args = arguments;
    return requestBridge.ready.then(function (adapter) {
      return adapter.requestWithoutLoading.apply(null, args);
    });
  };

  // 暴露到 window：迁移期经典核心脚本与 ESM runtime 的兼容接缝。
  window.__stellarRequestBridge = requestBridge;
  window.utils = utils;

})();
