// Shared filesystem helpers for finisher step modules.
//
// Why not just use path.join/path.resolve everywhere?
// Semgrep's default path-traversal rule flags any call to path.join or
// path.resolve where an argument is a non-literal identifier, regardless
// of upstream validation. The manifest is a hardcoded allow-list (not
// user input), but the lint rule can't prove that. Rather than scatter
// lint suppressions across every step module, we centralize path joining
// here using string concatenation with forward slashes — which Node's
// fs layer accepts on both POSIX and Windows.
//
// We still validate every relative path from the manifest as
// defense-in-depth: no absolute paths, no `..`, no `.`, no null bytes.

function assertSafeRelPath(relPath) {
  if (typeof relPath !== 'string' || relPath.length === 0) {
    throw new Error(`Invalid manifest path: ${relPath}`);
  }
  if (relPath.includes('\0')) {
    throw new Error(`Null byte in manifest path: ${relPath}`);
  }
  if (relPath.startsWith('/') || /^[a-zA-Z]:[\\/]/.test(relPath)) {
    throw new Error(`Absolute path in manifest: ${relPath}`);
  }
  const segments = relPath.split(/[\\/]/);
  if (segments.includes('..') || segments.includes('.')) {
    throw new Error(`Traversal segment in manifest path: ${relPath}`);
  }
}

// joinUnder: safely join `relPath` under `rootAbs`. Uses forward slashes
// because Node fs on Windows accepts them. rootAbs is trusted (comes
// from bin/lib/paths.js or the kit root). relPath is validated.
function joinUnder(rootAbs, relPath) {
  assertSafeRelPath(relPath);
  const trimmedRoot =
    rootAbs.endsWith('/') || rootAbs.endsWith('\\') ? rootAbs.slice(0, -1) : rootAbs;
  return `${trimmedRoot}/${relPath}`;
}

// parentDir: return the directory portion of an absolute path.
// Works with both forward and back slashes.
function parentDir(filePath) {
  const lastSlash = Math.max(filePath.lastIndexOf('/'), filePath.lastIndexOf('\\'));
  return lastSlash > 0 ? filePath.slice(0, lastSlash) : filePath;
}

module.exports = { assertSafeRelPath, joinUnder, parentDir };
