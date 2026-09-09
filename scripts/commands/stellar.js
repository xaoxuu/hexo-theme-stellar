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
  usage: "<doctor|new note|images> [options]",
  commands: [
    { name: "images", desc: "Incrementally prepare persistent image dimensions and colors without changing Markdown." },
    { name: "doctor", desc: "Validate the environment and v2 configuration." },
    { name: "new note", desc: "Create a Note in a known Notebook." }
  ],
  options: [
    { name: "--dry-run", desc: "Preview note creation or missing image metadata without writing files or downloading images." },
    { name: "--page <route>", desc: "Limit image discovery to one generated HTML page." },
    { name: "--refresh <url>", desc: "Refresh one image even when metadata already exists." },
    { name: "--format <text|json>", desc: "Doctor output format; use Hexo global --silent with JSON." },
    { name: "--notebook <id>", desc: "Notebook id for stellar new note." },
    { name: "--title <title>", desc: "Note title and filename for stellar new note." },
    { name: "--tags <tags>", desc: "Comma-separated Note tags." }
  ]
}, async function (args) {
  const subcommand = args._[0];
  if (subcommand === "images") {
    this.log?.info?.("Image metadata: rendering pages for image discovery…");
    await this.load();
    const report = await require("../lib/image-metadata").prepareImages(this, {
      dryRun: args.dryRun, page: args.page, refresh: args.refresh
    });
    console.log(JSON.stringify(report, null, 2));
    return report;
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
  throw new Error("Usage: hexo stellar <doctor|new note|images>");
});
