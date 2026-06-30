import { CommandDeniedError } from '@/lib/errors/ToolError';
import { COMMAND_BLACKLIST, COMMAND_WHITELIST, DANGEROUS_PATTERNS } from '@/lib/constants';

export class CommandGuard {
  /**
   * Validates that a command token is whitelisted and not blacklisted.
   * Throws CommandDeniedError if the command is not allowed.
   */
  static validateCommand(command: string): void {
    const normalized = command.trim().toLowerCase();

    // Explicit blacklist check
    const isBlacklisted = (COMMAND_BLACKLIST as readonly string[]).includes(normalized);
    if (isBlacklisted) {
      throw new CommandDeniedError(command);
    }

    // Whitelist check — only explicitly allowed commands pass
    const isWhitelisted = (COMMAND_WHITELIST as readonly string[]).includes(normalized);
    if (!isWhitelisted) {
      throw new CommandDeniedError(command);
    }
  }

  /**
   * Scans a string argument for shell injection patterns.
   * Throws CommandDeniedError if any dangerous pattern is found.
   */
  static validateArgument(arg: string, context: string): void {
    for (const pattern of DANGEROUS_PATTERNS) {
      if (pattern.test(arg)) {
        throw new CommandDeniedError(
          `Argument for "${context}" contains a forbidden pattern: ${pattern}`
        );
      }
    }
  }

  /**
   * Convenience method: validate a full command + args array.
   */
  static validateCommandWithArgs(command: string, args: string[]): void {
    CommandGuard.validateCommand(command);
    args.forEach((arg) => CommandGuard.validateArgument(arg, command));
  }
}
