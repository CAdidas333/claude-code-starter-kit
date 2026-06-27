const assert = require('node:assert');
const { test } = require('node:test');
const step07 = require('../07-install-mcps');

test('lean-ctx detection picks brew on Mac when present', () => {
  const result = step07._internal.pickLeanCtxInstaller({
    platform: 'darwin',
    has: { brew: true, scoop: false, winget: false },
  });
  assert.equal(result.kind, 'brew');
  assert.deepEqual(result.cmd, ['brew', 'install', 'yvgude/lean-ctx/lean-ctx']);
});

test('lean-ctx detection picks scoop on Windows when present', () => {
  const result = step07._internal.pickLeanCtxInstaller({
    platform: 'win32',
    has: { brew: false, scoop: true, winget: true },
  });
  assert.equal(result.kind, 'scoop');
  assert.deepEqual(result.cmd, ['scoop', 'install', 'lean-ctx']);
});

test('lean-ctx detection falls back to winget on Windows without scoop', () => {
  const result = step07._internal.pickLeanCtxInstaller({
    platform: 'win32',
    has: { brew: false, scoop: false, winget: true },
  });
  assert.equal(result.kind, 'winget');
});

test('lean-ctx detection returns manual when no installer is found', () => {
  const result = step07._internal.pickLeanCtxInstaller({
    platform: 'linux',
    has: { brew: false, scoop: false, winget: false },
  });
  assert.equal(result.kind, 'manual');
  assert.equal(result.cmd, null);
});
