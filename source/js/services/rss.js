utils.jq(() => {
  $(function () {
    const els = document.getElementsByClassName('ds-rss');

    for (let i = 0; i < els.length; i++) {
      const el = els[i];
      const api = el.dataset.api;
      if (!api) continue;

      utils.request(el, api, async resp => {
        const text = await resp.text();

        const head = text.slice(0, 1024).trim();
        const content_type = el.getAttribute('content_type') || 'content';
        const show_title = el.getAttribute('show_title') !== 'false';
        const show_content = el.getAttribute('show_content') !== 'false';
        const limit = parseInt(el.getAttribute('limit')) || 10;
        // JSON Feed
        if (head.startsWith('{') && head.includes('jsonfeed.org/version')) {
          handleJsonFeed(el, JSON.parse(text), content_type, show_title, show_content, limit);
          return;
        }

        const parser = new DOMParser();
        const doc = parser.parseFromString(text, 'text/xml');

        if (doc.querySelector('parsererror')) {
          console.error('Failed to parse feed XML.');
          return;
        }
        // Atom Feed
        if (doc.documentElement.nodeName === 'feed' &&
            doc.documentElement.namespaceURI === 'http://www.w3.org/2005/Atom') {
          handleAtom(el, doc, content_type, show_title, show_content, limit);
          return;
        }
        // RSS 2.0 Feed
        if (doc.documentElement.nodeName === 'rss') {
          handleRSS2(el, doc, content_type, show_title, show_content, limit);
          return;
        }
        // RSS 1.0 Feed
        if (doc.documentElement.nodeName === 'rdf:RDF') {
          handleRSS1(el, doc, content_type, show_title, show_content, limit);
          return;
        }
      });
    }
  });
});


function handleAtom(el, doc, content_type, show_title, show_content, limit) {
  const entries = doc.querySelectorAll('entry');
  const feedAuthorName = doc.querySelector('feed > author > name')?.textContent || '匿名';

  const limitedEntries = Array.from(entries).slice(0, limit);
  
  const htmlBuffer = limitedEntries.map((item, i) => {
    const title = item.querySelector('title')?.textContent || '无题';
    const link = item.querySelector('link')?.getAttribute('href') || '#';
    const published = item.querySelector('published, updated')?.textContent;
    const content = item.querySelector('content')?.textContent || '';
    const summary = item.querySelector('summary')?.textContent || '';
    const authorName = item.querySelector('author > name')?.textContent || feedAuthorName;

    let cell = `<div class="timenode" index="${i}">`;
    cell += `<div class="header">`;
    cell += `<span class="user-info"><strong>${authorName}</strong></span>`;
    
    if (published) {
      const date = new Date(published);
      cell += `<span>${date.toLocaleString()}</span>`;
    }
    cell += `</div>`;

    cell += `<div class="body">`;
    if (show_title) {
      const titleAttr = show_content ? '' : ' style="border-bottom:none;"' ;
      const linkAttr = show_content ? '' : ' style="padding-bottom:0"' ;
      cell += `<p class="title"${titleAttr}><a href="${link}"${linkAttr} target="_blank" rel="external nofollow noopener noreferrer">${title}</a></p>`;
    }
    if (show_content){
      cell += `<div class="content">${content_type === 'summary' ? summary : content}</div>`;
    }
    cell += `</div></div>`;
    
    return cell;
  }).join('');

  $(el).append(htmlBuffer);
}

function handleRSS2(el, doc, content_type, show_title, show_content, limit) {
  const items = Array.from(doc.querySelectorAll('item')).slice(0, limit);
  const feedAuthorName = doc.querySelector('channel > managingEditor, channel > webMaster, channel > title')?.textContent || '匿名';

  const htmlBuffer = items.map((item, i) => {
    const title = item.querySelector('title')?.textContent || '无题';
    const link = item.querySelector('link')?.textContent || '#';
    const pubDate = item.querySelector('pubDate')?.textContent;
    const content = item.getElementsByTagName('content:encoded')[0]?.textContent || '';
    const description = item.getElementsByTagName('description')[0]?.textContent || '';
    const authorName = item.querySelector('author, creator')?.textContent || feedAuthorName;

    let cell = `<div class="timenode" index="${i}">`;
    cell += `<div class="header">`;
    cell += `<span class="user-info"><strong>${authorName}</strong></span>`;
    if (pubDate) {
      const date = new Date(pubDate);
      cell += `<span>${isNaN(date) ? pubDate : date.toLocaleString()}</span>`;
    }
    cell += `</div>`;
    cell += `<div class="body">`;
    if (show_title) {
      const titleAttr = show_content ? '' : ' style="border-bottom:none;"' ;
      const linkAttr = show_content ? '' : ' style="padding-bottom:0"' ;
      cell += `<p class="title"${titleAttr}><a href="${link}"${linkAttr} target="_blank" rel="external nofollow noopener noreferrer">${title}</a></p>`;
    }
    if (show_content){
      cell += `<div class="content">${content_type === 'summary' ? description : content}</div>`;
    }
    cell += `</div></div>`;
    return cell;
  }).join('');

  $(el).append(htmlBuffer);
}
function handleRSS1(el, doc, content_type, show_title, show_content, limit) {
  const items = Array.from(doc.querySelectorAll('item')).slice(0, limit);
  const feedTitle = doc.querySelector('channel > title')?.textContent || '匿名';

  const htmlBuffer = items.map((item, i) => {
    const title = item.querySelector('title')?.textContent || '无题';
    const link = item.querySelector('link')?.textContent || '#';
    const pubDate = (item.querySelector('pubDate') || item.getElementsByTagName('dc:date')[0])?.textContent;
    const content = item.getElementsByTagName('content:encoded')[0]?.textContent || '';
    const description = (item.querySelector('description') || item.querySelector('summary'))?.textContent || '';
    const authorName = (item.querySelector('author') || item.getElementsByTagName('dc:creator')[0])?.textContent || feedTitle;

    let cell = `<div class="timenode" index="${i}">`;
    cell += `<div class="header">`;
    cell += `<span class="user-info"><strong>${authorName}</strong></span>`;
    if (pubDate) {
      const date = new Date(pubDate);
      cell += `<span>${isNaN(date) ? pubDate : date.toLocaleString()}</span>`;
    }
    cell += `</div>`;
    cell += `<div class="body">`;
    if (show_title) {
      const titleAttr = show_content ? '' : ' style="border-bottom:none;"' ;
      const linkAttr = show_content ? '' : ' style="padding-bottom:0"' ;
      cell += `<p class="title"${titleAttr}><a href="${link}"${linkAttr} target="_blank" rel="external nofollow noopener noreferrer">${title}</a></p>`;
    }
    if (show_content){
      cell += `<div class="content">${content_type === 'summary' ? description : content}</div>`;
    }
    cell += `</div></div>`;
    return cell;
  }).join('');

  $(el).append(htmlBuffer);
}
function handleJsonFeed(el, data, content_type, show_title, show_content, limit) {
  const items = (data.items || []).slice(0, limit);
  const feedAuthorName = data.authors?.[0]?.name || data.title || '匿名';

  const htmlBuffer = items.map((item, i) => {
    const id = item.id || i;
    const title = item.title || '无题';
    const link = item.url || '#';
    const pubDate = item.date_published;
    const content = item.content_html || '';
    const summary = item.summary || '';
    
    let authorName = (item.authors || []).map(a => a.name).filter(Boolean).join(' ') || feedAuthorName;

    let cell = `<div class="timenode" index="${id}">`;
    cell += `<div class="header">`;
    cell += `<span class="user-info"><strong>${authorName}</strong></span>`;
    if (pubDate) {
      const date = new Date(pubDate);
      cell += `<span>${isNaN(date.getTime()) ? pubDate : date.toLocaleString()}</span>`;
    }
    cell += `</div>`;
    cell += `<div class="body">`;
    if (show_title) {
      const titleAttr = show_content ? '' : ' style="border-bottom:none;"' ;
      const linkAttr = show_content ? '' : ' style="padding-bottom:0"' ;
      cell += `<p class="title"${titleAttr}><a href="${link}"${linkAttr} target="_blank" rel="external nofollow noopener noreferrer">${title}</a></p>`;
    }
    if (show_content){
      cell += `<div class="content">${content_type === 'summary' ? summary : content}</div>`;
    }
    cell += `</div></div>`;
    return cell;
  }).join('');

  $(el).append(htmlBuffer);
}