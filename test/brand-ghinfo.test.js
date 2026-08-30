"use strict";

const { test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const SERVICE_SOURCE = fs.readFileSync(
  path.resolve(__dirname, "../source/js/services/ghinfo.js"),
  "utf8"
);

async function runService(response) {
  const values = {
    followers: { textContent: "" },
    following: { textContent: "" },
    public_repos: { textContent: "" }
  };
  const initialValues = { ...values };
  const element = {
    dataset: { api: "https://api.github.com/users/xaoxuu" },
    classList: { contains() { return false; } },
    getAttribute() { return null; }
  };
  const pending = [];
  const context = {
    document: { getElementsByClassName() { return [element]; } },
    utils: {
      dom(target) {
        assert.equal(target, element);
        return {
          find(selector) {
            const id = selector.match(/#([\w-]+)$/)?.[1];
            return {
              text(value) {
                if (values[id]) values[id].textContent = String(value);
              },
              attr() {}
            };
          }
        };
      },
      request(_loading, api, success, failure) {
        assert.equal(api, element.dataset.api);
        if (response instanceof Error) {
          failure(response);
          return Promise.resolve();
        }
        const task = success({ json: async () => response });
        pending.push(task);
        return Promise.resolve(task);
      }
    }
  };
  vm.runInNewContext(SERVICE_SOURCE, context);
  await Promise.all(pending);
  return { element, initialValues, values };
}

test("ds-ghinfo 原位填写 Site Brand 三项空值且不替换节点", async () => {
  const result = await runService({ followers: 12, following: 34, public_repos: 56 });
  assert.deepEqual(Object.fromEntries(
    Object.entries(result.values).map(([key, node]) => [key, node.textContent])
  ), { followers: "12", following: "34", public_repos: "56" });
  for (const key of Object.keys(result.initialValues)) {
    assert.equal(result.values[key], result.initialValues[key]);
  }
});

test("ds-ghinfo 请求失败时保留完整数据区与空字符串", async () => {
  const result = await runService(new Error("offline"));
  assert.deepEqual(Object.fromEntries(
    Object.entries(result.values).map(([key, node]) => [key, node.textContent])
  ), { followers: "", following: "", public_repos: "" });
  assert.equal(result.element.dataset.api, "https://api.github.com/users/xaoxuu");
});
