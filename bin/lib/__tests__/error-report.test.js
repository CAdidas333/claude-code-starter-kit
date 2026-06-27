const assert = require('node:assert');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { test } = require('node:test');
const { writeErrorReport } = require('../error-report');

test('writeErrorReport creates a file on the Desktop with expected fields', () => {
  const tmpDesktop = fs.mkdtempSync(path.join(os.tmpdir(), 'desktop-'));
  const reportPath = writeErrorReport({
    step: 'step 07: install MCPs',
    command: 'npm run build',
    stderr: 'ENOENT: no such file',
    desktopOverride: tmpDesktop,
  });
  assert.ok(fs.existsSync(reportPath), 'report file was not created');
  const contents = fs.readFileSync(reportPath, 'utf8');
  assert.match(contents, /step 07/);
  assert.match(contents, /npm run build/);
  assert.match(contents, /ENOENT/);
  assert.match(contents, /System Info/);
  assert.match(contents, /Text this file/);
  fs.rmSync(tmpDesktop, { recursive: true });
});

test('writeErrorReport redacts ANTHROPIC_API_KEY value', () => {
  process.env.ANTHROPIC_API_KEY = 'sk-ant-secret-value';
  const tmpDesktop = fs.mkdtempSync(path.join(os.tmpdir(), 'desktop-'));
  const reportPath = writeErrorReport({
    step: 'step 99: testing redaction',
    command: 'echo test',
    stderr: '',
    desktopOverride: tmpDesktop,
  });
  const contents = fs.readFileSync(reportPath, 'utf8');
  assert.doesNotMatch(contents, /sk-ant-secret-value/);
  assert.match(contents, /ANTHROPIC_API_KEY: \[present\]/);
  delete process.env.ANTHROPIC_API_KEY;
  fs.rmSync(tmpDesktop, { recursive: true });
});
