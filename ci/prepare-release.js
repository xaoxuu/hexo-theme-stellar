#!/usr/bin/env node
'use strict';

const fs = require('node:fs');
const path = require('node:path');
const { assertReleaseVersion, releaseNotes } = require('../release');

function prepareReleaseMetadata(root) {
  const { version } = JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8'));
  assertReleaseVersion(version);
  const notes = releaseNotes(fs.readFileSync(path.join(root, 'CHANGELOG.md'), 'utf8'), version);
  if (!notes) throw new Error(`CHANGELOG.md 中缺少版本 ${version} 的非空章节`);
  return { version, notes };
}

if (require.main === module) {
  const { version, notes } = prepareReleaseMetadata(path.resolve(__dirname, '..'));
  fs.writeFileSync(process.env.RELEASE_NOTES_FILE, `${notes}\n`);
  fs.appendFileSync(process.env.GITHUB_OUTPUT, `version=${version}\n`);
}

module.exports = { prepareReleaseMetadata };
