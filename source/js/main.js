const l_body = document.querySelector('.l_body');

// 懒加载 js
function loadScript(src, cb) {
  setTimeout(function () {
    var HEAD =
      document.getElementsByTagName("head")[0] || document.documentElement;
    var script = document.createElement("script");
    script.setAttribute("type", "text/javascript");
    if (cb) script.onload = cb;
    script.setAttribute("src", src);
    HEAD.appendChild(script);
  });
}
// 懒加载 css https://github.com/filamentgroup/loadCSS
var loadCSS = function (href, before, media, attributes) {
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
};
// 弹出侧边栏
function toggleSidebar() {
  if (l_body) {
    l_body.classList.add('mobile');
    l_body.classList.toggle("sidebar");
  }
}

function setToc() {
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
  });
}

function setSedebar() {
  $("#toc a.toc-link").click(function(e) {
    l_body.classList.remove("sidebar");
  });
  $("#toc a#s-top").click(function(e) {
    l_body.classList.remove("sidebar");
  });
}

$(function () {
  setToc();
  setSedebar();
});

