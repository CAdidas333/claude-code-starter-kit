const fs = require('fs');
const { execFileSync } = require('child_process');
const log = require('../logger');
const paths = require('../paths');
const { joinUnder } = require('../fs-util');

// Step 08 turns ~/Projects/_brain into a git repo on first run. The
// brain is the user's cross-project memory — tracking it in git gives
// them a history of decisions, dashboards, and feedback without any
// extra effort.
//
// Idempotency: we check for paths.BRAIN/.git up front. If the brain is
// already a repo we skip the entire step. We do NOT try to stage new
// files or create additional commits — that's the user's job, and any
// future finisher runs must stay clean on a brain with unstaged edits.
//
// Safety: every git invocation uses execFileSync with a LITERAL command
// name ('git') and an array of args. execFileSync does not invoke a
// shell, so the individual args are passed through verbatim with no
// metacharacter interpretation. No string interpolation into a shell.

const GIT_DIR_NAME = '.git';

// Light validator for paths we feed to execFileSync's cwd option. The
// only dynamic path here is paths.BRAIN, which is derived from os.homedir
// in bin/lib/paths.js — already trusted — but adding a no-surprises
// check costs nothing.
function assertSafeCwd(dir) {
  if (typeof dir !== 'string' || dir.length === 0) {
    throw new Error(`Invalid cwd: ${dir}`);
  }
  if (dir.includes('\0')) {
    throw new Error(`Null byte in cwd: ${dir}`);
  }
}

function runGit(args, cwd) {
  assertSafeCwd(cwd);
  // Literal 'git' + array args = no shell = no command injection.
  return execFileSync('git', args, { cwd, stdio: 'pipe' });
}

// Run a git command and capture stdout as a trimmed string. Returns
// null on non-zero exit.
function runGitCapture(args, cwd) {
  try {
    const out = runGit(args, cwd);
    return out.toString('utf8').trim();
  } catch {
    return null;
  }
}

module.exports = {
  name: '08: Initialize brain git repository',
  fatal: true,
  async run() {
    log.header(module.exports.name);

    // If the brain directory itself doesn't exist yet, step 01 failed
    // or was skipped. Bail loudly — this is a state inconsistency we
    // shouldn't try to paper over.
    if (!fs.existsSync(paths.BRAIN)) {
      throw new Error(`Brain directory missing: ${paths.BRAIN}`);
    }

    const gitDir = joinUnder(paths.BRAIN, GIT_DIR_NAME);
    if (fs.existsSync(gitDir)) {
      log.ok('Brain is already a git repo — skipping');
      return;
    }

    // Initialize the repo. We prefer an explicit initial branch name
    // so the output is stable across git versions (some default to
    // "master", others to "main" depending on config).
    log.step(`git init ${paths.BRAIN}`);
    try {
      runGit(['init', '-b', 'main'], paths.BRAIN);
    } catch (err) {
      // Older gits (<2.28) don't support -b. Fall back to a plain init
      // and let the user rename later if they care.
      log.warn(`git init -b main failed, retrying without -b: ${err.message.split('\n')[0]}`);
      runGit(['init'], paths.BRAIN);
    }

    // Stage everything currently in the brain. The brain scaffold that
    // steps 01 and 02 laid down is what we want in the first commit.
    log.step('git add .');
    runGit(['add', '.'], paths.BRAIN);

    // Check whether anything is actually staged. On a totally empty
    // brain (if templates were missing) there would be nothing to
    // commit, and git commit would fail. That's not a finisher failure.
    const staged = runGitCapture(['diff', '--cached', '--name-only'], paths.BRAIN);
    if (!staged) {
      log.warn('Nothing staged — leaving brain as an empty git repo');
      if (!fs.existsSync(gitDir)) {
        throw new Error(`git init did not create ${gitDir}`);
      }
      return;
    }

    // Commit. Author/committer come from the user's git config. If the user
    // has no git identity configured, set a local one scoped to THIS repo
    // BEFORE committing — proactively, so the commit lands without an
    // alarming "commit failed" warning. (A fresh machine often has no global
    // git identity yet.) The user can amend the author later if they care.
    const haveName = runGitCapture(['config', 'user.name'], paths.BRAIN);
    const haveEmail = runGitCapture(['config', 'user.email'], paths.BRAIN);
    if (!haveName || !haveEmail) {
      log.step('No git identity found — setting a local one for the brain repo only');
      if (!haveEmail) runGit(['config', 'user.email', 'brain@localhost'], paths.BRAIN);
      if (!haveName) runGit(['config', 'user.name', 'Brain Finisher'], paths.BRAIN);
    }

    log.step('git commit');
    try {
      runGit(
        ['commit', '-m', 'Initialize brain - cross-project knowledge hub'],
        paths.BRAIN
      );
    } catch (err) {
      // Identity is handled above; any failure here is something else
      // (a hook, a permissions issue). Don't fail the whole finisher over
      // the brain's first auto-commit — the repo is still initialized.
      log.warn(`Brain initial commit didn't land: ${err.message.split('\n')[0]}`);
      log.warn('The brain is still a git repo — you can commit it yourself later.');
    }

    if (!fs.existsSync(gitDir)) {
      throw new Error(`git init appeared to succeed but ${gitDir} is missing`);
    }

    const headSha = runGitCapture(['rev-parse', '--short', 'HEAD'], paths.BRAIN);
    if (headSha) {
      log.ok(`Brain initialized at commit ${headSha}`);
    } else {
      log.ok('Brain git repo initialized');
    }
  },
};
