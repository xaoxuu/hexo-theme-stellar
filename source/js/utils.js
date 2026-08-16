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
          el.insertAdjacentHTML('beforeend', `<div class="loading-wrap">${ctx.icons['default:loading-spinner']}</div>`);
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
    /********************** data cache ********************************/
    // 动态数据本地缓存：TTL 未过期直接命中；过期后先显示缓存再后台刷新（stale-while-revalidate）
    _cacheEnabled: true,
    _cacheMaxEntryBytes: 200 * 1024,
    // 同 URL 并发请求去重：页面内多个组件请求同一接口时共享一次 fetch
    _pendingRequests: {},
    _fetchShared: (url, options) => {
      const key = (options && options.method || 'GET') + ' ' + url;
      if (utils._pendingRequests[key]) {
        return utils._pendingRequests[key].then(resp => resp.clone());
      }
      const promise = fetch(url, options).then(resp => {
        if (!resp.ok) throw new Error('响应失败');
        return resp;
      }).finally(() => {
        delete utils._pendingRequests[key];
      });
      utils._pendingRequests[key] = promise;
      // 每个调用方各自 clone，避免 Response body 被消费后其他调用方取不到数据
      return promise.then(resp => resp.clone());
    },
    // 延迟执行：缓存写入等非关键操作让出主线程
    _defer: (fn) => {
      if (window.requestIdleCallback) {
        window.requestIdleCallback(fn, { timeout: 3000 });
      } else {
        setTimeout(fn, 0);
      }
    },
    cache: {
      prefix: 'Stellar.data_cache.v1.',
      enabled: () => !!def.data_cache?.enable && utils._cacheEnabled,
      serviceId: (el, options) => {
        if (options && options.service) return options.service;
        if (el) {
          const match = String(el.className || '').match(/\bds-([\w-]+)\b/);
          if (match) return match[1];
        }
        return null;
      },
      ttl: (el, options) => {
        const conf = def.data_cache || {};
        const id = utils.cache.serviceId(el, options);
        const value = id && conf.ttl && conf.ttl[id] != null ? conf.ttl[id] : conf.default_ttl;
        return typeof value === 'number' && value > 0 ? value : 0;
      },
      shouldCache: (url, options) => {
        if (!utils.cache.enabled()) return false;
        if (options && (options.cache === false || options.cache === 'no-store')) return false;
        if (options && options.method && options.method !== 'GET') return false;
        // 带时间戳缓存破坏参数的请求不缓存（如 mdrender 的 ?t=）
        if (/[?&]t=\d{10,}/.test(url)) return false;
        return true;
      },
      get: (url) => {
        try {
          const raw = localStorage.getItem(utils.cache.prefix + url);
          if (!raw) return null;
          const entry = JSON.parse(raw);
          if (!entry || typeof entry.text !== 'string' || typeof entry.ts !== 'number') return null;
          return entry;
        } catch (e) {
          console.warn('[cache] 读取失败:', url, e);
          return null;
        }
      },
      set: (url, text, contentType, ttl) => {
        if (!(ttl > 0)) return;
        if (text.length > utils._cacheMaxEntryBytes) return;
        const entry = JSON.stringify({
          text: text,
          contentType: contentType || 'application/json',
          ts: Date.now(),
          ttl: ttl
        });
        const trySet = () => {
          try {
            localStorage.setItem(utils.cache.prefix + url, entry);
            utils.cache.trim();
            return true;
          } catch (e) {
            return false;
          }
        };
        if (!trySet()) {
          // 配额不足时淘汰最旧条目后重试一次，仍失败则本会话禁用缓存
          utils.cache.evictOldest(url);
          if (!trySet()) {
            console.warn('[cache] 写入失败，本会话禁用缓存:', url);
            utils._cacheEnabled = false;
          }
        }
      },
      trim: () => {
        try {
          const max = (def.data_cache && def.data_cache.max_entries) || 200;
          const keys = [];
          for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key && key.indexOf(utils.cache.prefix) === 0) keys.push(key);
          }
          if (keys.length <= max) return;
          const sorted = keys.map((key) => {
            let ts = 0;
            try {
              const entry = JSON.parse(localStorage.getItem(key) || 'null');
              if (entry && typeof entry.ts === 'number') ts = entry.ts;
            } catch (e) {}
            return { key, ts };
          }).sort((a, b) => a.ts - b.ts);
          for (let i = 0; i < sorted.length - max; i++) {
            localStorage.removeItem(sorted[i].key);
          }
        } catch (e) {
          console.warn('[cache] 清理失败:', e);
        }
      },
      evictOldest: (exceptUrl) => {
        try {
          let oldestKey = null;
          let oldestTs = Infinity;
          const exceptKey = utils.cache.prefix + exceptUrl;
          for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (!key || key.indexOf(utils.cache.prefix) !== 0 || key === exceptKey) continue;
            let ts = 0;
            try {
              const entry = JSON.parse(localStorage.getItem(key) || 'null');
              if (entry && typeof entry.ts === 'number') ts = entry.ts;
            } catch (e) {}
            if (ts < oldestTs) {
              oldestTs = ts;
              oldestKey = key;
            }
          }
          if (oldestKey) localStorage.removeItem(oldestKey);
        } catch (e) {}
      },
      isFresh: (entry) => {
        if (!entry || typeof entry.ts !== 'number' || typeof entry.ttl !== 'number') return false;
        if (!(entry.ttl > 0)) return false;
        return Date.now() - entry.ts < entry.ttl * 1000;
      },
      // 用缓存文本重建 Response，兼容回调中的 resp.json() / resp.text()
      toResponse: (entry) => new Response(entry.text, {
        status: 200,
        statusText: 'OK',
        headers: { 'Content-Type': entry.contentType }
      })
    },
    request: (el, url, callback, onFailure, options) => {
      // 检查元素实例是否已加载 (而不是检查属性)
      if (el && utils._loadedElements.has(el)) {
        return;
      }
      const maxRetry = 3;
      let retryCount = 0;
      const ttl = utils.cache.ttl(el, options);
      const cacheable = utils.cache.shouldCache(url, options) && ttl > 0;
      const cached = cacheable ? utils.cache.get(url) : null;
      // 缓存渲染前的初始结构，后台刷新渲染前恢复，避免重复渲染
      let initialHTML = null;
      // 缓存渲染完成后（或超时兜底）再启动后台刷新，避免异步渲染未结束就清空重绘
      let cacheRenderDone = null;

      if (cached) {
        if (el) {
          // 已有缓存时不显示加载动画
          utils.onLoadSuccess?.(el);
          initialHTML = el.innerHTML;
        }
        try {
          cacheRenderDone = Promise.resolve(callback(utils.cache.toResponse(cached))).catch(e => {
            console.warn('[request] 缓存渲染失败:', url, e);
          });
        } catch (e) {
          console.warn('[request] 缓存渲染失败:', url, e);
        }
        // 缓存未过期：直接完成，不发请求
        if (utils.cache.isFresh(cached)) {
          if (el) utils._loadedElements.add(el);
          return Promise.resolve(cached.text);
        }
      } else {
        utils.onLoading?.(el);
      }

      return new Promise((resolve, reject) => {
        const load = () => {
          let timedOut = false;
          const timeout = setTimeout(() => {
            timedOut = true;
            console.warn('[request] 超时:', url);

            if (++retryCount >= maxRetry) {
              if (cached) {
                // 已有缓存渲染，保留缓存内容，不显示失败
                resolve(cached.text);
              } else {
                utils.onLoadFailure?.(el);
                onFailure?.();
                reject('请求超时');
              }
            } else {
              setTimeout(load, 1000);
            }
          }, 5000);

          utils._fetchShared(url).then(resp => {
            if (timedOut) return;
            clearTimeout(timeout);
            return resp;
          }).then(data => {
            if (timedOut) return;
            // 标记元素实例为已加载
            if (el) utils._loadedElements.add(el);
            // 写入缓存：回调会立即消费 data 的 body，必须先同步 clone 再延迟读取
            if (cacheable && data.ok) {
              const cacheClone = data.clone();
              const contentType = data.headers.get('Content-Type') || 'application/json';
              utils._defer(() => {
                cacheClone.text().then(text => {
                  utils.cache.set(url, text, contentType, ttl);
                }).catch(() => {});
              });
            }
            // 后台刷新渲染前恢复初始结构，避免缓存渲染的内容重复
            if (el && initialHTML !== null) {
              el.innerHTML = initialHTML;
            }
            utils.onLoadSuccess?.(el);
            callback(data);
            resolve(data);
          }).catch(err => {
            clearTimeout(timeout);
            console.warn('[request] 错误:', err);

            if (++retryCount >= maxRetry) {
              if (cached) {
                resolve(cached.text);
              } else {
                utils.onLoadFailure?.(el);
                onFailure?.();
                reject(err);
              }
            } else {
              setTimeout(load, 1000);
            }
          });
        };

        if (cacheRenderDone) {
          Promise.race([
            cacheRenderDone,
            new Promise(resolve => setTimeout(resolve, 5000))
          ]).then(load);
        } else {
          load();
        }
      });
    },
    requestWithoutLoading: (url, options = {}, maxRetry = 2, timeout = 5000) => {
      const ttl = utils.cache.ttl(null, options);
      const cacheable = utils.cache.shouldCache(url, options) && ttl > 0;
      const cached = cacheable ? utils.cache.get(url) : null;

      if (cached && utils.cache.isFresh(cached)) {
        return Promise.resolve(utils.cache.toResponse(cached));
      }

      return new Promise((resolve, reject) => {
        let retryCount = 0;
        // 与 request 保持一致：最终失败时回退 stale 缓存，避免闪失败态
        const fallback = () => {
          if (cached) {
            resolve(utils.cache.toResponse(cached));
          } else {
            reject('timeout');
          }
        };

        const tryRequest = () => {
          let timedOut = false;
          const timer = setTimeout(() => {
            timedOut = true;
            if (++retryCount > maxRetry) fallback();
            else tryRequest();
          }, timeout);

          utils._fetchShared(url, options)
            .then(resp => {
              clearTimeout(timer);
              if (timedOut) return;
              if (cacheable) {
                // 调用方会消费 resp 的 body，必须先同步 clone 再延迟读取
                const cacheClone = resp.clone();
                const contentType = resp.headers.get('Content-Type') || 'application/json';
                utils._defer(() => {
                  cacheClone.text().then(text => {
                    utils.cache.set(url, text, contentType, ttl);
                  }).catch(() => {});
                });
              }
              resolve(resp);
            })
            .catch(err => {
              clearTimeout(timer);
              if (timedOut) return;
              if (++retryCount > maxRetry) {
                if (cached) {
                  resolve(utils.cache.toResponse(cached));
                } else {
                  reject(err);
                }
              } else {
                setTimeout(tryRequest, 500);
              }
            });
        };

        tryRequest();
      });
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

    // 插件初始化管理器 - 统一处理 DOMContentLoaded 事件
    _pluginInitializers: [],
    _pluginCleanups: new Map(), // 存储每个插件的清理函数
    
    initPlugin: (initFn, name, options = {}) => {
      if (!initFn || typeof initFn !== 'function') return;
      
      // 避免重复注册
      const pluginName = name || initFn.name;
      if (utils._pluginInitializers.some(p => p.name === pluginName)) return;
      
      // 包装初始化函数，添加防重复执行的保护
      const wrappedInit = () => {
        try {
          // 在执行前先清理旧的资源
          if (utils._pluginCleanups.has(pluginName)) {
            const cleanup = utils._pluginCleanups.get(pluginName);
            if (typeof cleanup === 'function') {
              cleanup();
            }
          }
          
          // 执行初始化，可能返回清理函数
          const cleanup = initFn();
          
          // 如果初始化函数返回了清理函数，保存它
          if (typeof cleanup === 'function') {
            utils._pluginCleanups.set(pluginName, cleanup);
          }
        } catch (error) {
          console.error(`[Plugin ${pluginName}] 初始化失败:`, error);
        }
      };
      
      utils._pluginInitializers.push({ 
        fn: wrappedInit, 
        name: pluginName,
        options: options 
      });
      
      // 如果 DOM 已经加载完成，立即执行
      if (document.readyState === 'complete' || document.readyState === 'interactive') {
        wrappedInit();
      } else {
        // 否则等待 DOMContentLoaded
        window.addEventListener('DOMContentLoaded', wrappedInit, { once: true });
      }
    },

    // 清理所有插件资源
    cleanupPlugins: () => {
      utils._pluginCleanups.forEach((cleanup, name) => {
        try {
          cleanup();
        } catch (error) {
          console.error(`[Plugin ${name}] 清理失败:`, error);
        }
      });
      utils._pluginCleanups.clear();
    },
    
    // 清理所有资源（用于页面卸载或重置）
    cleanupAll: () => {
      utils.cleanupPlugins();
    },
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

  // 暴露到 window：页尾插件片段经裸标识符 utils 即可使用
  window.utils = utils;

  // 补跑解析期注册的插件队列
  if (window.stellar && typeof window.stellar._flushPlugins === 'function') {
    window.stellar._flushPlugins();
  }
})();
