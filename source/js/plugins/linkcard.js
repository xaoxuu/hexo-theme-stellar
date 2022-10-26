// 本插件由CardLink定制而成，原项目源码: https://github.com/Lete114/CardLink

var cardLink = {};
cardLink.caches = {};
cardLink.server = 'https://api.allorigins.win/raw?url=';

/**
 * Remove '/' and '/index.html'
 * @param {String} params
 * @returns { String }
 */
function indexHandler(params) {
  let path = params.replace(/(\/index\.html|\/)*$/gi, '')
  if (path.length === 0) path += '/'
  return path
}

/**
 * Determine if it is a ['https://', 'http://', '//'] protocol
 * @param {String} url Website url
 * @returns {Boolean}
 */
function isHttp(url) {
  return /^(https?:)?\/\//g.test(url)
}

function renderer(el, obj) {
  if (obj.title && obj.title.length > 0) {
    el.querySelector('.title').innerHTML = obj.title;
  }
  if (obj.icon && obj.icon.length > 0) {
    el.querySelector('.img').style = 'background-image: url("' + obj.icon + '");';
  }
  let desc = el.querySelector('.desc');
  if (desc && obj.desc && obj.desc.length > 0) {
    desc.innerHTML = obj.desc;
  }
}

/**
 * Get info
 * @param {Element} el Element
 * @param {String} html String type html
 * @param {String} link Website address
 */
// eslint-disable-next-line max-statements
function getInfo(el, html, link) {
  try {
    let title, icon, desc
    const doc = new DOMParser().parseFromString(html, 'text/html')
    // If there is no title, no card link is generated
    title = doc.querySelector('title')
    if (title) {
      title = title.textContent

      // Get the src of the first img tag in the body tag
      let tmp = doc.querySelector('head link[rel="apple-touch-icon"]')
      if (!tmp) {
        tmp = doc.querySelector('head link[rel="icon"]')
      }
      icon = tmp && tmp.getAttribute('href')

      if (/^data:image/.test(icon)) icon = ''

      // If there is no src then get the site icon
      if (!icon) {
        const links = [].slice.call(doc.querySelectorAll('link[rel][href]'))
        icon = links.find((_el) => _el.rel.includes('icon'))
        icon = icon && icon.getAttribute('href')
      }
      
      desc = doc.querySelector('head meta[name="description"]')

      if (desc) {
        desc = desc.content;
      }
      // If `icon` is not the ['https://', 'http://', '//'] protocol, splice on the `origin` of the a tag
      if (icon && !isHttp(icon)) icon = new URL(link).origin + icon
      cardLink.caches[link] = { title, link, icon, desc }
      
      renderer(el, cardLink.caches[link])
    }
  } catch (error) {
    // eslint-disable-next-line no-console
    console.warn('CardLink Error: Failed to parse', error)
  }
}

function fetchPage(link, callback) {
  fetch(link)
    .then((result) => result.text())
    .then(callback)
    .catch((error) => {
      const server = cardLink.server
      // eslint-disable-next-line no-console
      if (link.includes(server) || !server) return console.error('CardLink Error:', error)
      fetchPage(server + link, callback)
    })
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
    if (el.nodeType !== 1) return
    el.removeAttribute('cardlink')
    const link = el.href

    const cache = cardLink.caches[link]
    if (cache) return renderer(el, cache)

    if (isHttp(link)) {
      fetchPage(link, (html) => {
        getInfo(el, html, link)
      })
    }
  })
}
