/* global hexo */
"use strict";

const path = require("node:path");
const readline = require("node:readline/promises");

const {
  buildBlueprintPlan,
  formatBlueprintPlan,
  loadCatalog,
  writeBlueprintPlan
} = require("../lib/blueprints");
const { formatDoctorJson, formatDoctorText, runDoctor } = require("../lib/doctor");
const { buildNewNotePlan, formatNewNotePlan, writeNewNotePlan } = require("../lib/new-note");
const { BLUEPRINT_IDS, VISUAL_STYLE_IDS } = require("../schema/blueprint-schema");

function requireChoice(value, choices, label) {
  const index = Number(value);
  if (!Number.isInteger(index) || index < 1 || index > choices.length) {
    throw new Error(`${label} 必须是 1-${choices.length}`);
  }
  return choices[index - 1];
}

async function promptSelection(args, catalog) {
  if (args.nonInteractive) {
    return { blueprint: args.blueprint || BLUEPRINT_IDS[0], style: args.style };
  }
  if (!process.stdin.isTTY || !process.stdout.isTTY) {
    if (!args.blueprint) throw new Error("非交互终端必须提供 --blueprint 或 --non-interactive");
    return { blueprint: args.blueprint, style: args.style };
  }
  const input = readline.createInterface({ input: process.stdin, output: process.stdout });
  try {
    let blueprint = args.blueprint;
    if (!blueprint) {
      console.log(BLUEPRINT_IDS.map((id, index) => `${index + 1}. ${catalog.blueprints[id].name}`).join("\n"));
      blueprint = requireChoice(await input.question("Choose a Blueprint: "), BLUEPRINT_IDS, "Blueprint");
    }
    let style = args.style;
    if (!style) {
      console.log(VISUAL_STYLE_IDS.map((id, index) => `${index + 1}. ${catalog.styles[id].name}`).join("\n"));
      const answer = await input.question(`Choose a Visual Style [${catalog.blueprints[blueprint]?.defaultStyle || "stellar"}]: `);
      style = answer.trim().length === 0
        ? catalog.blueprints[blueprint]?.defaultStyle
        : requireChoice(answer, VISUAL_STYLE_IDS, "Visual Style");
    }
    return { blueprint, style, input };
  } catch (error) {
    input.close();
    throw error;
  }
}

function hexoVersion(ctx) {
  try {
    const file = require.resolve("hexo/package.json", { paths: [ctx.base_dir] });
    return require(file).version;
  } catch (error) {
    return String(ctx.version || "");
  }
}

hexo.extend.console.register("stellar", "Initialize, diagnose, and author a Stellar v2 site.", {
  usage: "<init|doctor|new note> [options]",
  commands: [
    { name: "init", desc: "Generate a Stellar v2 Blueprint." },
    { name: "doctor", desc: "Validate the environment and v2 configuration." },
    { name: "new note", desc: "Create a Note in a known Notebook." }
  ],
  options: [
    { name: "--blueprint <id>", desc: "classic | minimal-reading | docs-reference | light-and-shadow" },
    { name: "--style <id>", desc: "card | flat | glass | minimal" },
    { name: "--dry-run", desc: "Print the init plan without writing files." },
    { name: "--non-interactive", desc: "Never prompt for input." },
    { name: "--format <text|json>", desc: "Doctor output format; use Hexo global --silent with JSON." },
    { name: "--notebook <id>", desc: "Notebook id for stellar new note." },
    { name: "--title <title>", desc: "Note title and filename for stellar new note." },
    { name: "--tags <tags>", desc: "Comma-separated Note tags." }
  ]
}, async function (args) {
  const subcommand = args._[0];
  if (subcommand === "init") {
    const catalog = loadCatalog({ themeRoot: this.theme_dir });
    let selection;
    try {
      selection = await promptSelection(args, catalog);
      const plan = buildBlueprintPlan({
        catalog,
        baseDir: this.base_dir,
        blueprint: selection.blueprint,
        style: selection.style
      });
      console.log(formatBlueprintPlan(plan, { dryRun: args.dryRun }));
      if (args.dryRun) return plan;
      if (selection.input) {
        const answer = await selection.input.question("Write these files? [y/N]: ");
        if (!/^y(?:es)?$/i.test(answer.trim())) return plan;
      }
      writeBlueprintPlan(plan);
      console.log(`Created ${plan.files.length} file(s) in ${path.resolve(this.base_dir)}`);
      return plan;
    } finally {
      selection?.input?.close();
    }
  }
  if (subcommand === "doctor") {
    const format = args.format || "text";
    if (!["text", "json"].includes(format)) throw new Error("--format 必须是 text 或 json");
    const result = runDoctor({ baseDir: this.base_dir, hexoVersion: hexoVersion(this) });
    console.log(format === "json" ? formatDoctorJson(result) : formatDoctorText(result));
    if (!result.ok) process.exitCode = 1;
    return result;
  }
  if (subcommand === "new" && args._[1] === "note") {
    const plan = buildNewNotePlan({
      baseDir: this.base_dir,
      sourceDir: this.source_dir,
      notebook: args.notebook,
      title: args.title,
      tags: args.tags
    });
    console.log(formatNewNotePlan(plan, { dryRun: args.dryRun }));
    if (!args.dryRun) {
      writeNewNotePlan(plan);
      console.log(`Created ${plan.outputPath}`);
    }
    return plan;
  }
  throw new Error("Usage: hexo stellar <init|doctor|new note>");
});
