"use strict";

const { test } = require("node:test");
const assert = require("node:assert/strict");
const {
  resetPageViewModels,
  setPageConfig
} = require("../scripts/lib/page-view-model-registry");

function query(items) {
  return {
    filter(predicate) {
      return query(items.filter(predicate));
    },
    sort() {
      return this;
    },
    each(callback) {
      items.forEach(callback);
    }
  };
}

test("search.json 输出 Blog、Topic 双归属及 Collection domains", () => {
  let generator = null;
  global.hexo = {
    extend: {
      generator: {
        register(name, callback) {
          if (name === "search_json_generator") generator = callback;
        }
      }
    }
  };
  delete require.cache[require.resolve("../scripts/generators/search")];
  require("../scripts/generators/search");
  assert.equal(typeof generator, "function");

  const normalPost = { source: "_posts/normal.md", layout: "post", title: "Normal", path: "normal", content: "normal" };
  const topicPost = { source: "_posts/topic.md", layout: "post", title: "Topic", path: "topic", content: "topic" };
  const wikiPage = { source: "wiki/stellar/index.md", layout: "wiki", title: "Wiki", path: "wiki/stellar", content: "wiki" };
  const notebookPage = { source: "notes/one.md", layout: "page", title: "Note", path: "notes/one", content: "note" };
  const independentPage = { source: "about/index.md", layout: "page", title: "About", path: "about", content: "about" };

  resetPageViewModels();
  setPageConfig(normalPost, { visibility: { searchable: true } });
  setPageConfig(topicPost, { visibility: { searchable: true }, collection: { profile: "topic", id: "stellar" } });
  setPageConfig(wikiPage, { visibility: { searchable: true }, collection: { profile: "wiki", id: "stellar" } });
  setPageConfig(notebookPage, { visibility: { searchable: true }, collection: { profile: "notebook", id: "notes" } });
  setPageConfig(independentPage, { visibility: { searchable: true } });

  const generated = generator.call({
    config: { root: "/" },
    stellar: {
      config: {
        extensions: {
          search: {
            provider: "local",
            providers: { local: { scope: "all", includeContent: true } }
          }
        }
      }
    }
  }, {
    posts: query([normalPost, topicPost]),
    pages: query([wikiPage, notebookPage, independentPage])
  });
  const records = JSON.parse(generated.data);
  const byTitle = Object.fromEntries(records.map(record => [record.title, record]));

  assert.deepEqual(byTitle.Normal.domains, ["blog"]);
  assert.deepEqual(byTitle.Topic.domains, ["blog", "topic:stellar"]);
  assert.deepEqual(byTitle.Wiki.domains, ["wiki:stellar"]);
  assert.deepEqual(byTitle.Note.domains, ["notebook:notes"]);
  assert.equal(Object.hasOwn(byTitle.About, "domains"), false);

  resetPageViewModels();
  delete global.hexo;
});
