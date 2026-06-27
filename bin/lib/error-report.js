// error-report.js — write a Desktop-level diagnostic file when the
// installer cannot recover. Same module called from setup.sh and setup.ps1
// via `node bin/lib/error-report.js --json '<payload>'`.

const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { execSync } = require('node:child_process');

function desktopPath() {
  if (process.platform === 'win32') {
    return path.join(process.env.USERPROFILE || os.homedir(), 'Desktop');
  }
  return path.join(os.homedir(), 'Desktop');
}

function safeCmd(cmd) {
  try {
    return execSync(cmd, { encoding: 'utf8', timeout: 3000 }).trim();
  } catch {
    return '(unavailable)';
  }
}

function gatherSystemInfo() {
  const info = {
    'OS platform': process.platform,
    'OS release': os.release(),
    'Node version': process.version,
    'npm version': safeCmd('npm --version'),
    'git path': safeCmd(process.platform === 'win32' ? 'where git' : 'which git'),
    'gh path': safeCmd(process.platform === 'win32' ? 'where gh' : 'which gh'),
    'claude path': safeCmd(process.platform === 'win32' ? 'where claude' : 'which claude'),
    'HOME': os.homedir(),
    'PATH (truncated)': (process.env.PATH || '').slice(0, 500) + '...',
  };
  if (process.platform === 'win32') {
    info['PowerShell version'] = safeCmd('powershell -Command "$PSVersionTable.PSVersion.ToString()"');
    info['APPDATA'] = process.env.APPDATA || '(unset)';
  }
  // Redacted secret presence flags
  info['ANTHROPIC_API_KEY'] = process.env.ANTHROPIC_API_KEY ? '[present]' : '[absent]';
  info['COUNCIL_GEMINI_API_KEY'] = process.env.COUNCIL_GEMINI_API_KEY ? '[present]' : '[absent]';
  info['COUNCIL_OPENAI_API_KEY'] = process.env.COUNCIL_OPENAI_API_KEY ? '[present]' : '[absent]';
  info['COUNCIL_NVIDIA_API_KEY'] = process.env.COUNCIL_NVIDIA_API_KEY ? '[present]' : '[absent]';
  return info;
}

function formatReport({ step, command, stderr, sysinfo, timestamp }) {
  const truncatedStderr = (stderr || '').slice(0, 4096);
  const lines = [
    'Claude Code Starter Kit — Install Error Report',
    '='.repeat(60),
    '',
    `Timestamp:  ${timestamp}`,
    `Step:       ${step}`,
    `Command:    ${command}`,
    '',
    'Error output (truncated to 4KB):',
    '-'.repeat(60),
    truncatedStderr,
    '-'.repeat(60),
    '',
    'System Info',
    '-'.repeat(60),
    ...Object.entries(sysinfo).map(([k, v]) => `${k}: ${v}`),
    '-'.repeat(60),
    '',
    'What to do next',
    '-'.repeat(60),
    'Text this file to the kit maintainer along with one sentence',
    'describing what you were trying to do when the installer broke.',
    'No secrets are in this file — API keys are flagged only as present/absent.',
    '',
  ];
  return lines.join('\n');
}

function writeErrorReport({ step, command, stderr, extra, desktopOverride }) {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const dir = desktopOverride || desktopPath();
  fs.mkdirSync(dir, { recursive: true });
  const filename = `starter-kit-broke-${timestamp}.txt`;
  const filepath = path.join(dir, filename);
  const sysinfo = gatherSystemInfo();
  const body = formatReport({ step, command, stderr, sysinfo, timestamp });
  fs.writeFileSync(filepath, body);
  return filepath;
}

// CLI entry: `node bin/lib/error-report.js --json '<payload>'`
if (require.main === module) {
  const args = process.argv.slice(2);
  const jsonIdx = args.indexOf('--json');
  if (jsonIdx === -1 || !args[jsonIdx + 1]) {
    console.error('Usage: error-report.js --json \'<{step,command,stderr}>\'');
    process.exit(2);
  }
  let payload;
  try {
    payload = JSON.parse(args[jsonIdx + 1]);
  } catch (err) {
    console.error('Invalid JSON payload:', err.message);
    process.exit(2);
  }
  const reportPath = writeErrorReport(payload);
  console.log(reportPath);
}

module.exports = { writeErrorReport, gatherSystemInfo, formatReport };
