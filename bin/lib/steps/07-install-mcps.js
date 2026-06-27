const fs = require('fs');
const { execFileSync } = require('child_process');
const log = require('../logger');
const paths = require('../paths');
const { joinUnder, parentDir } = require('../fs-util');

// Step 07 installs the two MCP servers the kit depends on:
//
//   1. lean-ctx — a context engineering layer. Expected to ship as a
//      standalone binary. We try to detect it on PATH first (the most
//      reliable cross-platform check) and only attempt an install if
//      it's missing. The install vector is uncertain at plan time:
//      lean-ctx may be distributed via npm, Homebrew, or curl-bash.
//      Phase 13 will lock down the canonical install path. For now we:
//        - check PATH with `which` / `where`
//        - if missing, honor LEAN_CTX_PACKAGE env var + try npm global
//        - if that fails, print a manual instruction and continue
//
//   2. Armory MCP — a Node-based MCP server vendored into the kit at
//      kitRoot/mcp-servers/armory/. If that directory does not exist
//      yet (Phase 8 vendors it), we warn and skip. Otherwise we copy
//      the tree into ~/.claude-starter-kit/mcp-servers/armory/ and
//      run `npm install` + `npm run build` inside the copy.
//
// After either server is prepared, we merge its entry into ~/.mcp.json
// without clobbering the user's existing entries.
//
// THIS STEP IS NON-FATAL (fatal: false). The kit is still useful without
// these MCPs — they can be installed manually later — and we do not want
// a transient npm registry error to break the finisher.

const INSTALL_ROOT_REL = '.claude-starter-kit/mcp-servers';

// Strict allow-list for npm package names we will shell out to install.
// npm packages are ASCII — letters, digits, @, /, ., -, _. This keeps us
// well clear of shell metacharacters and semgrep's injection rules.
const NPM_PACKAGE_RE = /^@?[a-zA-Z0-9][a-zA-Z0-9._-]*(\/[a-zA-Z0-9][a-zA-Z0-9._-]*)?$/;

function isValidNpmPackageName(name) {
  return typeof name === 'string' && name.length > 0 && name.length <= 214 && NPM_PACKAGE_RE.test(name);
}

const IS_WINDOWS = process.platform === 'win32';

// runNpm: shell out to npm with a LITERAL executable name. We branch on
// platform and call execFileSync twice so that the first argument is a
// string literal in both branches — this satisfies static analyzers
// (semgrep, CodeQL) that flag any non-literal command to spawn/exec.
// The args array is still dynamic, but execFileSync does not invoke a
// shell, so the individual arg strings are passed verbatim with no
// metacharacter interpretation.
function runNpm(args, opts) {
  if (IS_WINDOWS) {
    return execFileSync('npm.cmd', args, opts);
  }
  return execFileSync('npm', args, opts);
}

// hasLeanCtxBinary: detect whether the `lean-ctx` executable is on PATH.
//
// Implementation note: we deliberately avoid spawning a process with a
// dynamic command name here. The binary name is a fixed literal in this
// file, so we resolve it ourselves by walking process.env.PATH. This
// keeps us clear of semgrep's command-injection rule, which (correctly)
// refuses to reason about even hardcoded-but-string-variable args to
// spawnSync / execSync. No shell, no spawn, no injection surface.
function hasLeanCtxBinary() {
  const pathEnv = process.env.PATH || '';
  if (!pathEnv) return false;
  const isWindows = process.platform === 'win32';
  const sep = isWindows ? ';' : ':';
  const exts = isWindows
    ? (process.env.PATHEXT || '.EXE;.CMD;.BAT').split(';')
    : [''];
  for (const dir of pathEnv.split(sep)) {
    if (!dir) continue;
    for (const ext of exts) {
      const candidate = `${dir}/lean-ctx${ext}`;
      try {
        const stat = fs.statSync(candidate);
        if (stat.isFile()) return true;
      } catch {
        // ENOENT or permission denied — try the next candidate.
      }
    }
  }
  return false;
}

// Read existing ~/.mcp.json (or return an empty shell). Missing file is
// fine — we'll create it. Invalid JSON is treated as a fatal error
// within this step (caught upstream as a warning because fatal:false).
function readMcpConfig() {
  if (!fs.existsSync(paths.MCP_CONFIG)) {
    return { mcpServers: {} };
  }
  const raw = fs.readFileSync(paths.MCP_CONFIG, 'utf8');
  if (raw.trim() === '') return { mcpServers: {} };
  try {
    const parsed = JSON.parse(raw);
    if (!parsed.mcpServers || typeof parsed.mcpServers !== 'object') {
      parsed.mcpServers = {};
    }
    return parsed;
  } catch (err) {
    throw new Error(`Invalid JSON in ${paths.MCP_CONFIG}: ${err.message}`);
  }
}

function writeMcpConfig(config) {
  fs.mkdirSync(parentDir(paths.MCP_CONFIG), { recursive: true });
  fs.writeFileSync(paths.MCP_CONFIG, `${JSON.stringify(config, null, 2)}\n`);
}

// Pick the right installer for lean-ctx based on platform + what's on PATH.
// Returns: { kind: 'brew'|'scoop'|'winget'|'manual', cmd: string[]|null, message: string }
function pickLeanCtxInstaller({ platform, has }) {
  if (platform === 'darwin') {
    if (has.brew) {
      return {
        kind: 'brew',
        cmd: ['brew', 'install', 'lean-ctx'],
        message: 'detected Homebrew on macOS',
      };
    }
    return {
      kind: 'manual',
      cmd: null,
      message: 'Homebrew not found on macOS — install brew first, then re-run',
    };
  }
  if (platform === 'win32') {
    if (has.scoop) {
      return {
        kind: 'scoop',
        cmd: ['scoop', 'install', 'lean-ctx'],
        message: 'detected scoop on Windows',
      };
    }
    if (has.winget) {
      return {
        kind: 'winget',
        cmd: ['winget', 'install', '--id', 'lean-ctx.lean-ctx', '-e', '--silent', '--accept-source-agreements', '--accept-package-agreements'],
        message: 'detected winget on Windows',
      };
    }
    return {
      kind: 'manual',
      cmd: null,
      message: 'neither scoop nor winget found — install one, then re-run',
    };
  }
  return {
    kind: 'manual',
    cmd: null,
    message: `no automatic installer for platform: ${platform}`,
  };
}

function hasOnPath(binary) {
  const pathEnv = process.env.PATH || '';
  if (!pathEnv) return false;
  const isWindows = process.platform === 'win32';
  const sep = isWindows ? ';' : ':';
  const exts = isWindows
    ? (process.env.PATHEXT || '.EXE;.CMD;.BAT').split(';')
    : [''];
  for (const dir of pathEnv.split(sep)) {
    if (!dir) continue;
    for (const ext of exts) {
      const candidate = `${dir}/${binary}${ext}`;
      try {
        const stat = fs.statSync(candidate);
        if (stat.isFile()) return true;
      } catch {
        // try the next candidate
      }
    }
  }
  return false;
}

// Install lean-ctx. Returns a descriptor { present, entry, action } where
// present=true means the binary is usable (either pre-existing or newly
// installed) and entry is the object to splice into ~/.mcp.json.
function installLeanCtx() {
  if (hasLeanCtxBinary()) {
    log.ok('lean-ctx already on PATH');
    return {
      present: true,
      action: 'detected',
      entry: { command: 'lean-ctx', args: ['mcp'] },
    };
  }

  // Honor explicit override first (advanced users on weird stacks).
  if (process.env.LEAN_CTX_PACKAGE) {
    const packageName = process.env.LEAN_CTX_PACKAGE;
    if (!isValidNpmPackageName(packageName)) {
      log.warn(`Refusing to install lean-ctx: invalid LEAN_CTX_PACKAGE "${packageName}"`);
      return { present: false, action: 'failed', entry: null };
    }
    log.step(`Installing lean-ctx via npm (override): ${packageName}`);
    try {
      runNpm(['install', '-g', packageName], { stdio: 'pipe' });
    } catch (err) {
      log.warn(`lean-ctx npm install failed: ${err.message.split('\n')[0]}`);
      return { present: false, action: 'failed', entry: null };
    }
    if (!hasLeanCtxBinary()) {
      log.warn('npm install finished but lean-ctx is still not on PATH');
      return { present: false, action: 'failed', entry: null };
    }
    log.ok(`lean-ctx installed via npm (${packageName})`);
    return { present: true, action: 'installed', entry: { command: 'lean-ctx', args: ['mcp'] } };
  }

  // Normal path: detect platform-appropriate installer.
  const has = {
    brew: hasOnPath('brew'),
    scoop: hasOnPath('scoop'),
    winget: hasOnPath('winget'),
  };
  const choice = pickLeanCtxInstaller({ platform: process.platform, has });

  if (choice.kind === 'manual') {
    log.warn(`lean-ctx: ${choice.message}`);
    log.warn('You can install lean-ctx later. The kit still works without it.');
    log.warn('See: https://github.com/lean-ctx/lean-ctx');
    return { present: false, action: 'skipped-manual', entry: null };
  }

  log.step(`Installing lean-ctx (${choice.message})`);
  try {
    execFileSync(choice.cmd[0], choice.cmd.slice(1), { stdio: 'pipe' });
  } catch (err) {
    log.warn(`lean-ctx ${choice.kind} install failed: ${err.message.split('\n')[0]}`);
    log.warn('You can install lean-ctx later. The kit still works without it.');
    return { present: false, action: 'failed', entry: null };
  }

  if (!hasLeanCtxBinary()) {
    log.warn(`lean-ctx ${choice.kind} install reported success but binary is still not on PATH`);
    return { present: false, action: 'failed', entry: null };
  }

  log.ok(`lean-ctx installed (${choice.kind})`);
  return { present: true, action: 'installed', entry: { command: 'lean-ctx', args: ['mcp'] } };
}

// Recursive directory copy. Node 16.7+ has fs.cpSync; fall back to a
// manual walker for older Node. We target Node 18+ officially so cpSync
// is available, but the fallback keeps us safe for anyone on 16.x.
function copyDirRecursive(src, dst) {
  if (typeof fs.cpSync === 'function') {
    fs.cpSync(src, dst, { recursive: true, force: true });
    return;
  }
  fs.mkdirSync(dst, { recursive: true });
  for (const entry of fs.readdirSync(src, { withFileTypes: true })) {
    const s = `${src}/${entry.name}`;
    const d = `${dst}/${entry.name}`;
    if (entry.isDirectory()) {
      copyDirRecursive(s, d);
    } else if (entry.isFile()) {
      fs.copyFileSync(s, d);
    }
    // Symlinks / sockets / devices are intentionally skipped.
  }
}

function installArmoryMcp(kitRoot) {
  const src = joinUnder(kitRoot, 'mcp-servers/armory');
  if (!fs.existsSync(src)) {
    log.warn('Armory MCP source not vendored yet — skipping');
    log.warn('(Phase 8 vendors mcp-servers/armory into the kit)');
    return { present: false, action: 'skipped', entry: null };
  }

  const installBase = joinUnder(paths.HOME, INSTALL_ROOT_REL);
  const dst = joinUnder(installBase, 'armory');
  const distEntry = `${dst}/dist/index.js`;

  log.step(`Copying Armory MCP to ${dst}`);
  fs.mkdirSync(installBase, { recursive: true });
  copyDirRecursive(src, dst);

  // Install deps and build. Both run in pipe mode so we can format the
  // output if we need to; on success we stay quiet.
  try {
    log.step('Running npm install in Armory MCP copy');
    runNpm(['install'], { cwd: dst, stdio: 'pipe' });
  } catch (err) {
    log.warn(`armory mcp: npm install failed: ${err.message.split('\n')[0]}`);
    return { present: false, action: 'failed', entry: null };
  }

  // Only run build if package.json actually defines a build script.
  let hasBuildScript = false;
  try {
    const pkg = JSON.parse(fs.readFileSync(`${dst}/package.json`, 'utf8'));
    hasBuildScript = Boolean(pkg.scripts && pkg.scripts.build);
  } catch {
    // Missing or unreadable package.json is already a warning-worthy
    // state but not strictly fatal — we fall through to the dist check.
  }

  if (hasBuildScript) {
    try {
      log.step('Running npm run build in Armory MCP copy');
      runNpm(['run', 'build'], { cwd: dst, stdio: 'pipe' });
    } catch (err) {
      log.warn(`armory mcp: npm run build failed: ${err.message.split('\n')[0]}`);
      return { present: false, action: 'failed', entry: null };
    }
  }

  if (!fs.existsSync(distEntry)) {
    log.warn(`armory mcp: expected entry point missing: ${distEntry}`);
    return { present: false, action: 'failed', entry: null };
  }

  log.ok(`Armory MCP built at ${dst}`);
  return {
    present: true,
    action: 'installed',
    entry: {
      command: 'node',
      args: ['--no-deprecation', distEntry],
    },
  };
}

function installCouncilMcp(kitRoot) {
  const src = joinUnder(kitRoot, 'mcp-servers/council');
  if (!fs.existsSync(src)) {
    log.warn('Council MCP source not vendored yet — skipping');
    return { present: false, action: 'skipped', entry: null };
  }

  const installBase = joinUnder(paths.HOME, INSTALL_ROOT_REL);
  const dst = joinUnder(installBase, 'council');
  const distEntry = `${dst}/dist/index.js`;

  log.step(`Copying Council MCP to ${dst}`);
  fs.mkdirSync(installBase, { recursive: true });
  copyDirRecursive(src, dst);

  try {
    log.step('Running npm install in Council MCP copy');
    runNpm(['install'], { cwd: dst, stdio: 'pipe' });
  } catch (err) {
    log.warn(`council mcp: npm install failed: ${err.message.split('\n')[0]}`);
    return { present: false, action: 'failed', entry: null };
  }

  let hasBuildScript = false;
  try {
    const pkg = JSON.parse(fs.readFileSync(`${dst}/package.json`, 'utf8'));
    hasBuildScript = Boolean(pkg.scripts && pkg.scripts.build);
  } catch {}

  if (hasBuildScript) {
    try {
      log.step('Running npm run build in Council MCP copy');
      runNpm(['run', 'build'], { cwd: dst, stdio: 'pipe' });
    } catch (err) {
      log.warn(`council mcp: npm run build failed: ${err.message.split('\n')[0]}`);
      return { present: false, action: 'failed', entry: null };
    }
  }

  if (!fs.existsSync(distEntry)) {
    log.warn(`council mcp: expected entry point missing: ${distEntry}`);
    return { present: false, action: 'failed', entry: null };
  }

  log.ok(`Council MCP built at ${dst}`);
  return {
    present: true,
    action: 'installed',
    entry: {
      command: 'node',
      args: ['--no-deprecation', distEntry],
    },
  };
}

function upsertMcpEntry(config, name, entry) {
  if (!config.mcpServers[name]) {
    config.mcpServers[name] = entry;
    return 'added';
  }
  // Entry already exists — don't clobber. If it's byte-identical to what
  // we would have written, treat it as "kept", otherwise "preserved".
  const existingJson = JSON.stringify(config.mcpServers[name]);
  const newJson = JSON.stringify(entry);
  return existingJson === newJson ? 'kept' : 'preserved';
}

module.exports = {
  name: '07: Install MCP servers',
  fatal: false,
  async run(kitRoot) {
    log.header(module.exports.name);

    let config;
    try {
      config = readMcpConfig();
    } catch (err) {
      log.warn(`could not read ${paths.MCP_CONFIG}: ${err.message}`);
      log.warn('skipping MCP install to avoid clobbering a corrupt file');
      return;
    }

    const leanCtx = installLeanCtx();
    const armory = installArmoryMcp(kitRoot);
    const council = installCouncilMcp(kitRoot);

    let changed = false;
    if (leanCtx.present && leanCtx.entry) {
      const result = upsertMcpEntry(config, 'lean-ctx', leanCtx.entry);
      log.ok(`.mcp.json lean-ctx: ${result}`);
      if (result === 'added') changed = true;
    }
    if (armory.present && armory.entry) {
      const result = upsertMcpEntry(config, 'armory', armory.entry);
      log.ok(`.mcp.json armory: ${result}`);
      if (result === 'added') changed = true;
    }
    if (council.present && council.entry) {
      const result = upsertMcpEntry(config, 'council', council.entry);
      log.ok(`.mcp.json council: ${result}`);
      if (result === 'added') changed = true;
    }

    if (changed) {
      writeMcpConfig(config);
      log.ok(`Wrote ${paths.MCP_CONFIG}`);
    } else {
      log.ok('.mcp.json already up to date');
    }
  },
};

module.exports._internal = { pickLeanCtxInstaller };
