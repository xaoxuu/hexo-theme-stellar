/* global hexo */
"use strict";

const { formatDoctorJson, formatDoctorText, runDoctor } = require("../lib/doctor");
const { buildNewNotePlan, formatNewNotePlan, writeNewNotePlan } = require("../lib/new-note");

function hexoVersion(ctx) {
  try {
    const file = require.resolve("hexo/package.json", { paths: [ctx.base_dir] });
    return require(file).version;
  } catch (error) {
    return String(ctx.version || "");
  }
}

hexo.extend.console.register("stellar", "Diagnose and author a Stellar v2 site.", {
  usage: "<doctor|new note> [options]",
  commands: [
    { name: "doctor", desc: "Validate the environment and v2 configuration." },
    { name: "new note", desc: "Create a Note in a known Notebook." }
  ],
  options: [
    { name: "--dry-run", desc: "Print the new note plan without writing files." },
    { name: "--format <text|json>", desc: "Doctor output format; use Hexo global --silent with JSON." },
    { name: "--notebook <id>", desc: "Notebook id for stellar new note." },
    { name: "--title <title>", desc: "Note title and filename for stellar new note." },
    { name: "--tags <tags>", desc: "Comma-separated Note tags." }
  ]
}, async function (args) {
  const subcommand = args._[0];
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
  throw new Error("Usage: hexo stellar <doctor|new note>");
});
