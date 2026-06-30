// Commands explicitly allowed via execa
export const COMMAND_WHITELIST = ['ls', 'pwd', 'cat', 'mkdir', 'touch', 'mv', 'cp'] as const;

// Commands that are always blocked
export const COMMAND_BLACKLIST = [
  'sudo',
  'su',
  'rm',
  'chmod',
  'chown',
  'chgrp',
  'curl',
  'wget',
  'ssh',
  'scp',
  'rsync',
  'shutdown',
  'reboot',
  'halt',
  'poweroff',
  'kill',
  'killall',
  'pkill',
  'dd',
  'mkfs',
  'fdisk',
  'mount',
  'umount',
  'nc',
  'netcat',
  'nmap',
  'python',
  'python3',
  'node',
  'bash',
  'sh',
  'zsh',
  'eval',
  'exec',
  'source',
] as const;

// Shell injection patterns to detect and reject
export const DANGEROUS_PATTERNS = [
  /;/,           // command chaining
  /\|/,          // pipe
  /&&/,          // AND chaining
  /\|\|/,        // OR chaining
  /`/,           // backtick execution
  /\$\(/,        // command substitution
  />\s*\//,      // redirect to absolute path
  />>/,          // append redirect
  /<\(/,         // process substitution
  /\.\.\//,      // path traversal (covered also by PathValidator)
  /\/etc\//,     // system config
  /\/proc\//,    // system processes
  /\/sys\//,     // system files
] as const;

// File size limits
export const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB in bytes
export const MAX_FILE_SIZE_LABEL = '5MB';

// Execution limits
export const TOOL_TIMEOUT_MS = 10_000; // 10 seconds

// Confirmation token TTL
export const CONFIRMATION_TOKEN_TTL_MS = 60_000; // 1 minute

// Path restrictions
export const ALLOWED_BASE_PATHS = [
  process.env['HOME'] ?? '/home',
  '/tmp',
] as const;
