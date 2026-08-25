#!/usr/bin/env node

"use strict";

const path = require("node:path");
const { assertContributionRegistry } = require("../scripts/lib/contribution-audit");
const { CONTRIBUTIONS } = require("../scripts/lib/contribution-registry");
const INTERNAL_CONSTANTS = require("../scripts/lib/internal-constants");

const root = path.resolve(__dirname, "..");
assertContributionRegistry({
  root,
  definitions: CONTRIBUTIONS,
  assets: INTERNAL_CONSTANTS.assets
});
process.stdout.write(`Contribution registry: ${CONTRIBUTIONS.length} descriptors verified.\n`);
