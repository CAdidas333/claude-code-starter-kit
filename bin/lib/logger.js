const COLORS = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  red: '\x1b[31m',
};

// Enable colors when attached to a TTY, or when FORCE_COLOR is set.
// Modern Windows Terminal handles ANSI fine, so we no longer gate on platform.
// Legacy cmd.exe without a TTY will drop to no-color automatically.
const useColor = Boolean(process.stdout.isTTY) || Boolean(process.env.FORCE_COLOR);

function c(color, text) {
  if (!useColor) return text;
  return `${COLORS[color]}${text}${COLORS.reset}`;
}

module.exports = {
  step:    (msg) => console.log(c('yellow', '-> ') + msg),
  ok:      (msg) => console.log(c('green',  'OK ') + msg),
  warn:    (msg) => console.log(c('yellow', '!! ') + msg),
  fail:    (msg) => console.log(c('red',    'XX ') + msg),
  header:  (msg) => {
    console.log('');
    console.log(c('blue', '=== ' + msg + ' ==='));
  },
  blank:   () => console.log(''),
};
