const l_body = document.querySelector('.l_body');

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
  $(".social-wrap a.comment").click(function(e) {
    l_body.classList.remove("sidebar");
  });
}

$(function () {
  setToc();
  setSedebar();
});