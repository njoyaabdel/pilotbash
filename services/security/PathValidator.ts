import path from 'path';
import { PathError } from '@/lib/errors/ToolError';
import { ALLOWED_BASE_PATHS } from '@/lib/constants';

export class PathValidator {
  /**
   * Resolves and validates a path:
   * - Normalises with path.resolve()
   * - Detects ../ traversal attempts
   * - Ensures the path stays under an allowed base
   */
  static validate(rawPath: string): string {
    if (!rawPath || typeof rawPath !== 'string') {
      throw new PathError(String(rawPath), 'Path must be a non-empty string.');
    }

    // Reject obviously dangerous inputs before resolving
    if (rawPath.includes('\0')) {
      throw new PathError(rawPath, 'Path contains null bytes.');
    }

    const resolved = path.resolve(rawPath);

    // Check that the resolved path starts with an allowed base
    const isAllowed = ALLOWED_BASE_PATHS.some((base) =>
      resolved.startsWith(base + path.sep) || resolved === base
    );

    if (!isAllowed) {
      throw new PathError(
        rawPath,
        `Access is restricted to allowed directories. Resolved to: ${resolved}`
      );
    }

    return resolved;
  }

  /**
   * Validates a path but allows an explicit base to be specified.
   * Useful for operations that work relative to a user-supplied directory.
   */
  static validateUnder(rawPath: string, base: string): string {
    const resolvedBase = path.resolve(base);
    const resolved = path.resolve(rawPath);

    if (!resolved.startsWith(resolvedBase + path.sep) && resolved !== resolvedBase) {
      throw new PathError(rawPath, `Path must be inside "${resolvedBase}".`);
    }

    return resolved;
  }

  /** Checks if a path looks like a traversal attempt (for logging / fast reject). */
  static isTraversalAttempt(rawPath: string): boolean {
    return rawPath.includes('../') || rawPath.includes('..\\') || rawPath === '..';
  }
}
