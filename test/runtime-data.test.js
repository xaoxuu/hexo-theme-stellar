"use strict";

const { test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const attachRuntimeData = require("../scripts/events/lib/config");
const { ensureRuntimeData, runtimeDataAt } = require("../scripts/lib/runtime-data");

const ROOT = path.resolve(__dirname, "..");

test("主题数据与构建派生对象只写入 hexo.stellar.data", () => {
  const themeConfig = Object.freeze({ site: Object.freeze({}) });
  const ctx = {
    config: {},
    theme: { config: themeConfig },
    theme_dir: ROOT,
    locals: { get: key => key === "data" ? {
      icons: { custom: "<svg>custom</svg>" },
      widgets: { recent: { limit: 3 } },
      chat_users: { bot: { name: "Bot" } }
    } : null },
    render: {
      renderSync({ path: file }) {
        if (file.endsWith("widgets.yml")) return { recent: { limit: 5 }, toc: {} };
        if (file.endsWith("icons.yml")) return { default: "<svg>default</svg>" };
        throw new Error(`unexpected data file: ${file}`);
      }
    }
  };

  attachRuntimeData(ctx);

  assert.equal(ctx.theme.config, themeConfig);
  assert.deepEqual(ctx.stellar.data.widgets, { recent: { limit: 3 }, toc: {} });
  assert.deepEqual(ctx.stellar.data.icons, { default: "<svg>default</svg>", custom: "<svg>custom</svg>" });
  assert.deepEqual(ctx.stellar.data.chatUsers, { bot: { name: "Bot" } });
  assert.deepEqual(ctx.config.pretty_urls, { trailing_index: false, trailing_html: false });
});

test("runtime data helper 按 camelCase 内部路径读取且不创建公开配置字段", () => {
  const ctx = { stellar: { config: { site: {} } } };
  const data = ensureRuntimeData(ctx);
  data.defaultAuthor = { id: "xaoxuu" };

  assert.equal(runtimeDataAt(ctx, "defaultAuthor.id"), "xaoxuu");
  assert.equal(runtimeDataAt(ctx, "missing"), undefined);
  assert.deepEqual(ctx.stellar.config, { site: {} });
});

test("运行时消费者不再读取 theme.config 派生数据", () => {
  const files = ["layout", "scripts/helpers", "scripts/generators", "scripts/tags", "scripts/events", "scripts/lib"];
  const source = files.flatMap(relative => {
    const absolute = path.join(ROOT, relative);
    const entries = [];
    const visit = target => {
      for (const entry of fs.readdirSync(target, { withFileTypes: true })) {
        const file = path.join(target, entry.name);
        if (entry.isDirectory()) visit(file);
        else if (/\.(?:js|ejs)$/.test(entry.name)) entries.push(fs.readFileSync(file, "utf8"));
      }
    };
    visit(absolute);
    return entries;
  }).join("\n");

  assert.doesNotMatch(source, /(?:ctx\.|hexo\.|this\.)?theme\.config\.(?:icons|widgets|authors|default_author|links|chat_users|wiki|topic|notebooks)/);
  assert.doesNotMatch(source, /theme\.(?:icons|widgets|authors|default_author|wiki|topic|notebooks)/);
});
