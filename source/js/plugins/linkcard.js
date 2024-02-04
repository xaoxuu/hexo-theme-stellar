// 本插件由CardLink定制而成，原项目源码: https://github.com/Lete114/CardLink

function renderer(el, obj) {
  var autofill = [];
  const autofillStr = el.getAttribute('autofill');
  if (autofillStr) {
    autofill = autofillStr.split(',');
  }
  if (obj.title && obj.title.length > 0 && autofill.includes('title')) {
    el.querySelector('.title').innerHTML = obj.title;
    el.title = obj.title;
  }
  if (obj.icon && obj.icon.length > 0 && autofill.includes('icon')) {
    el.querySelector('.img').style = 'background-image: url("' + obj.icon + '");';
    el.querySelector('.img').setAttribute('data-bg', obj.icon);
  }
  let desc = el.querySelector('.desc');
  if (desc && obj.desc && obj.desc.length > 0 && autofill.includes('desc')) {
    desc.innerHTML = obj.desc;
  }
}

/**
 * Create card links
 * @param {NodeList} nodes A collection of nodes or a collection of arrays,
 * if it is an array then the array must always contain node element
 */
function setCardLink(nodes) {
  // If the `nodes` do not contain a `forEach` method, then the default `a[cardlink]` is used
  nodes = 'forEach' in (nodes || {}) ? nodes : document.querySelectorAll('a[cardlink]')
  nodes.forEach((el) => {
    // If it is not a tag element then it is not processed
    if (el.nodeType !== 1) return;
    el.removeAttribute('cardlink');
    const api = el.getAttribute('api');
    if (api == null) return;
    fetch(api).then(function(response) {
      if (response.ok) {
        return response.json();
      }
      throw new Error('Network response was not ok.');
    }).then(function(data) {
      renderer(el, data);
    }).catch(function(error) {
      console.error(error);
    });
  })
}
