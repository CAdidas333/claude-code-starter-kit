#!/usr/bin/env node
// Cross-platform finisher for the Claude Code Starter Kit.
// Runs identically on Mac and Windows once Node + Claude Code are present.
// Idempotent — safe to re-run for updates or recovery.

const path = require('path');
const log = require('./lib/logger');
const paths = require('./lib/paths');

// Step modules are loaded dynamically inside the loop so the orchestrator
// can run (and print its header) even before every step file exists.
// Missing step modules are reported as warnings and skipped; broken ones
// still raise real errors via the normal fatal/non-fatal path.
const STEP_MODULES = [
  './lib/steps/01-create-workspace',
  './lib/steps/02-install-brain-templates',
  './lib/steps/03-install-skills',
  './lib/steps/04-install-agents',
  './lib/steps/05-install-hooks',
  './lib/steps/06-merge-settings',
  './lib/steps/07-install-mcps',
  './lib/steps/08-initialize-git',
  './lib/steps/09-write-welcome-marker',
  './lib/steps/10-verify',
];

function loadStep(modulePath) {
  try {
    return { step: require(modulePath), error: null };
  } catch (err) {
    if (err && err.code === 'MODULE_NOT_FOUND' && err.message.includes(modulePath)) {
      return { step: null, error: 'missing' };
    }
    return { step: null, error: err };
  }
}

async function main() {
  log.header('Claude Code Starter Kit — Finisher');
  log.blank();

  const kitRoot = path.resolve(__dirname, '..');
  log.step(`Kit source: ${kitRoot}`);
  log.step(`Workspace:  ${paths.PROJECTS}`);
  log.blank();

  for (const modulePath of STEP_MODULES) {
    const { step, error } = loadStep(modulePath);

    if (error === 'missing') {
      log.warn(`Step module not yet implemented: ${modulePath} — skipping`);
      continue;
    }
    if (error) {
      log.fail(`Failed to load ${modulePath}: ${error.message}`);
      process.exit(1);
    }

    try {
      await step.run(kitRoot);
    } catch (err) {
      if (step.fatal !== false) {
        log.fail(`${step.name} failed: ${err.message}`);
        process.exit(1);
      } else {
        log.warn(`${step.name} had a non-fatal error: ${err.message}`);
        log.warn('Continuing. You can re-run to retry this step.');
      }
    }
  }

  log.blank();
  log.header('Setup Complete');
  log.blank();
  log.ok('Next step — copy-paste this one command:');
  log.blank();
  console.log('    cd ~/Projects && claude');
  log.blank();
  log.ok('When Claude starts, type:  /welcome');
  log.blank();
}

main().catch((err) => {
  log.fail(`Unexpected error: ${err.message}`);
  console.error(err);
  process.exit(1);
});
