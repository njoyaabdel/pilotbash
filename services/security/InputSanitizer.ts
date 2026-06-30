import { DANGEROUS_PATTERNS } from '@/lib/constants';
import { PathError } from '@/lib/errors/ToolError';

export class InputSanitizer {
  /**
   * Escapes shell-dangerous characters from a string.
   * This is a defensive measure — always prefer parameterised tool calls
   * over concatenating strings into shell commands.
   */
  static escapeShellArg(input: string): string {
    // Wrap in single quotes and escape existing single quotes
    return `'${input.replace(/'/g, "'\\''")}'`;
  }

  /**
   * Checks if a string contains shell-dangerous patterns.
   * Returns true if the input is safe, false otherwise.
   */
  static isSafe(input: string): boolean {
    return !DANGEROUS_PATTERNS.some((pattern) => pattern.test(input));
  }

  /**
   * Asserts that a string is free from injection patterns.
   * Throws PathError with a descriptive message if unsafe.
   */
  static assertSafe(input: string, fieldName: string): void {
    if (!InputSanitizer.isSafe(input)) {
      throw new PathError(
        input,
        `Field "${fieldName}" contains potentially dangerous characters.`
      );
    }
  }

  /**
   * Strips null bytes and trims whitespace.
   * Always call before passing user input to file system operations.
   */
  static sanitize(input: string): string {
    return input.replace(/\0/g, '').trim();
  }
}
