const fs = require('fs');
const log = require('../logger');
const paths = require('../paths');
const { KIT_FILES } = require('../manifest');
const { joinUnder, parentDir } = require('../fs-util');

// Step 06 merges the kit's settings template into the user's existing
// ~/.claude/settings.json. The user's settings are authoritative — kit
// values only ADD, never overwrite:
//
//   Top-level scalar keys (cleanupPeriodDays, effortLevel, theme, ...):
//     kit value only if the user has no value for that key.
//
//   permissions.allow / deny / ask arrays:
//     union of both arrays, deduped by exact string match.
//
//   hooks.<EventName> (SessionStart, PreToolUse, PostToolUse, ...):
//     both sides typically carry arrays of { matcher, hooks: [...] }.
//     We union the arrays and dedupe by matcher — the user's entry wins
//     when the same matcher is defined on both sides.
//
//   enabledPlugins object:
//     shallow merge with user winning on key conflicts.
//
//   Any other top-level object:
//     shallow merge, user wins on conflicts.
//
// Idempotency: running this step twice in a row produces an identical file
// the second time. Each merge rule is itself idempotent (union of a set
// with itself is the same set, "user wins" is stable under re-merge).
//
// Safety: before writing, we back up the existing file to
// ~/.claude/settings.json.backup-<timestamp>. Backups are NOT cleaned up
// automatically — the user can delete them once they're happy with the
// merged result.

const SETTINGS_SRC_REL = KIT_FILES.settings; // e.g. 'templates/settings.json'

function readJsonOrDefault(filePath, fallback) {
  if (!fs.existsSync(filePath)) return fallback;
  const raw = fs.readFileSync(filePath, 'utf8');
  if (raw.trim() === '') return fallback;
  try {
    return JSON.parse(raw);
  } catch (err) {
    throw new Error(`Failed to parse JSON at ${filePath}: ${err.message}`);
  }
}

function isPlainObject(value) {
  return (
    value !== null &&
    typeof value === 'object' &&
    !Array.isArray(value)
  );
}

function unionArray(userArr, kitArr) {
  const out = [];
  const seen = new Set();
  const push = (item) => {
    const key = typeof item === 'string' ? item : JSON.stringify(item);
    if (seen.has(key)) return;
    seen.add(key);
    out.push(item);
  };
  for (const item of Array.isArray(userArr) ? userArr : []) push(item);
  for (const item of Array.isArray(kitArr) ? kitArr : []) push(item);
  return out;
}

// Merge permissions object: union each of allow / deny / ask, keep any
// other user-defined permission keys untouched.
function mergePermissions(userPerms, kitPerms) {
  const user = isPlainObject(userPerms) ? userPerms : {};
  const kit = isPlainObject(kitPerms) ? kitPerms : {};
  const merged = { ...user };
  const arrayKeys = new Set(['allow', 'deny', 'ask', ...Object.keys(kit)]);
  for (const key of arrayKeys) {
    const userVal = user[key];
    const kitVal = kit[key];
    if (Array.isArray(userVal) || Array.isArray(kitVal)) {
      merged[key] = unionArray(userVal, kitVal);
    } else if (isPlainObject(userVal) || isPlainObject(kitVal)) {
      merged[key] = { ...(isPlainObject(kitVal) ? kitVal : {}), ...(isPlainObject(userVal) ? userVal : {}) };
    } else if (key in user) {
      merged[key] = user[key];
    } else if (key in kit) {
      merged[key] = kit[key];
    }
  }
  return merged;
}

// Merge hooks object: each event (SessionStart, PreToolUse, ...) holds an
// array of { matcher, hooks: [...] } entries. We union the arrays and
// dedupe by matcher — the user's entry for a given matcher wins.
function mergeHooks(userHooks, kitHooks) {
  const user = isPlainObject(userHooks) ? userHooks : {};
  const kit = isPlainObject(kitHooks) ? kitHooks : {};
  const merged = {};
  const eventNames = new Set([...Object.keys(user), ...Object.keys(kit)]);

  for (const event of eventNames) {
    const userEntries = Array.isArray(user[event]) ? user[event] : [];
    const kitEntries = Array.isArray(kit[event]) ? kit[event] : [];
    const byMatcher = new Map();
    // Insert kit entries first so user entries overwrite on matcher collision.
    for (const entry of kitEntries) {
      const matcher = entry && typeof entry === 'object' ? entry.matcher : undefined;
      const key = matcher === undefined ? JSON.stringify(entry) : `m:${matcher}`;
      byMatcher.set(key, entry);
    }
    for (const entry of userEntries) {
      const matcher = entry && typeof entry === 'object' ? entry.matcher : undefined;
      const key = matcher === undefined ? JSON.stringify(entry) : `m:${matcher}`;
      byMatcher.set(key, entry);
    }
    merged[event] = Array.from(byMatcher.values());
  }
  return merged;
}

// Shallow merge where user wins on conflicts. Safe default for any
// top-level object we don't have a smarter rule for.
function shallowMergeUserWins(userObj, kitObj) {
  const user = isPlainObject(userObj) ? userObj : {};
  const kit = isPlainObject(kitObj) ? kitObj : {};
  return { ...kit, ...user };
}

function mergeSettings(userSettings, kitSettings) {
  const user = isPlainObject(userSettings) ? userSettings : {};
  const kit = isPlainObject(kitSettings) ? kitSettings : {};

  const merged = { ...user };
  const allKeys = new Set([...Object.keys(user), ...Object.keys(kit)]);

  for (const key of allKeys) {
    const userVal = user[key];
    const kitVal = kit[key];
    const userHas = Object.prototype.hasOwnProperty.call(user, key);
    const kitHas = Object.prototype.hasOwnProperty.call(kit, key);

    if (key === 'permissions') {
      merged[key] = mergePermissions(userVal, kitVal);
      continue;
    }
    if (key === 'hooks') {
      merged[key] = mergeHooks(userVal, kitVal);
      continue;
    }
    if (key === 'enabledPlugins') {
      merged[key] = shallowMergeUserWins(userVal, kitVal);
      continue;
    }

    // Arrays at the top level: union (same semantics as permissions.allow).
    if (Array.isArray(userVal) || Array.isArray(kitVal)) {
      merged[key] = unionArray(userVal, kitVal);
      continue;
    }

    // Plain objects at the top level: shallow merge, user wins.
    if (isPlainObject(userVal) || isPlainObject(kitVal)) {
      merged[key] = shallowMergeUserWins(userVal, kitVal);
      continue;
    }

    // Scalars / primitives: kit value only if user has no value.
    if (userHas) {
      merged[key] = userVal;
    } else if (kitHas) {
      merged[key] = kitVal;
    }
  }
  return merged;
}

function backupExisting(filePath) {
  if (!fs.existsSync(filePath)) return null;
  const ts = new Date().toISOString().replace(/[:.]/g, '-');
  const backupPath = `${filePath}.backup-${ts}`;
  fs.copyFileSync(filePath, backupPath);
  return backupPath;
}

module.exports = {
  name: '06: Merge settings.json',
  fatal: true,
  async run(kitRoot) {
    log.header(module.exports.name);

    const src = joinUnder(kitRoot, SETTINGS_SRC_REL);
    if (!fs.existsSync(src)) {
      log.warn(`settings template missing, skipping: ${SETTINGS_SRC_REL}`);
      log.warn('Phase 9 will create this file. Re-run the finisher afterwards.');
      return;
    }

    const kitSettings = readJsonOrDefault(src, {});
    const userSettings = readJsonOrDefault(paths.CLAUDE_SETTINGS, {});

    const merged = mergeSettings(userSettings, kitSettings);
    const mergedJson = `${JSON.stringify(merged, null, 2)}\n`;

    // If the file already exists AND the merged result matches the current
    // contents byte-for-byte, do nothing — no backup, no write. This keeps
    // repeat runs clean and avoids accumulating backup files.
    if (fs.existsSync(paths.CLAUDE_SETTINGS)) {
      const currentRaw = fs.readFileSync(paths.CLAUDE_SETTINGS, 'utf8');
      if (currentRaw === mergedJson) {
        log.ok('settings.json already merged — no changes needed');
        return;
      }
    }

    const backup = backupExisting(paths.CLAUDE_SETTINGS);

    fs.mkdirSync(parentDir(paths.CLAUDE_SETTINGS), { recursive: true });
    fs.writeFileSync(paths.CLAUDE_SETTINGS, mergedJson);

    if (backup) {
      log.ok(`settings.json merged (backup: ${backup})`);
    } else {
      log.ok('settings.json written (no previous file)');
    }
  },
  // Exported for test harnesses — not part of the public step contract.
  _internal: { mergeSettings, unionArray, mergeHooks, mergePermissions },
};
