import fs from 'fs/promises';
import path from 'path';
import { PathValidator } from '@/services/security/PathValidator';
import type { DirectoryEntry } from '@/types';

/**
 * FileSystemService is the single abstraction layer over Node.js fs/promises.
 * Tools call this service instead of using fs directly.
 * This keeps tools thin and testable (the service can be mocked in tests).
 */
export class FileSystemService {
  /**
   * Lists the entries of a directory. Returns typed DirectoryEntry objects.
   */
  static async listDirectory(rawPath: string): Promise<{ entries: DirectoryEntry[]; resolvedPath: string }> {
    const resolvedPath = PathValidator.validate(rawPath);
    const dirents = await fs.readdir(resolvedPath, { withFileTypes: true });

    const entries = await Promise.all(
      dirents.map(async (dirent): Promise<DirectoryEntry> => {
        const fullPath = path.join(resolvedPath, dirent.name);
        try {
          const stats = await fs.stat(fullPath);
          return {
            name: dirent.name,
            type: dirent.isDirectory() ? 'directory' : dirent.isSymbolicLink() ? 'symlink' : 'file',
            size: stats.size,
            modifiedAt: stats.mtime,
            path: fullPath,
          };
        } catch {
          return { name: dirent.name, type: 'file', size: 0, modifiedAt: new Date(0), path: fullPath };
        }
      })
    );

    return { entries, resolvedPath };
  }

  /** Reads a text file and returns its content as a string (plus the raw buffer, for callers that need byte-level inspection — e.g. binary detection). */
  static async readFile(
    rawPath: string
  ): Promise<{ content: string; size: number; resolvedPath: string; buffer: Buffer }> {
    const resolvedPath = PathValidator.validate(rawPath);
    const stats = await fs.stat(resolvedPath);
    const buffer = await fs.readFile(resolvedPath);
    return { content: buffer.toString('utf-8'), size: stats.size, resolvedPath, buffer };
  }

  /** Writes content to a file, optionally overwriting. */
  static async writeFile(rawPath: string, content: string): Promise<string> {
    const resolvedPath = PathValidator.validate(rawPath);
    await fs.writeFile(resolvedPath, content, 'utf-8');
    return resolvedPath;
  }

  /** Creates a directory recursively. */
  static async createDirectory(rawPath: string): Promise<string> {
    const resolvedPath = PathValidator.validate(rawPath);
    await fs.mkdir(resolvedPath, { recursive: true });
    return resolvedPath;
  }

  /** Moves a file or directory. Falls back to copy+delete on EXDEV. */
  static async move(rawSrc: string, rawDest: string): Promise<{ from: string; to: string }> {
    const src = PathValidator.validate(rawSrc);
    const dest = PathValidator.validate(rawDest);
    try {
      await fs.rename(src, dest);
    } catch (err) {
      if ((err as NodeJS.ErrnoException).code === 'EXDEV') {
        await fs.copyFile(src, dest);
        await fs.unlink(src);
      } else {
        throw err;
      }
    }
    return { from: src, to: dest };
  }

  /** Deletes a file (not a directory). */
  static async deleteFile(rawPath: string): Promise<string> {
    const resolvedPath = PathValidator.validate(rawPath);
    await fs.unlink(resolvedPath);
    return resolvedPath;
  }

  /** Checks if a path exists. Returns false instead of throwing. */
  static async exists(rawPath: string): Promise<boolean> {
    try {
      const resolved = PathValidator.validate(rawPath);
      await fs.access(resolved);
      return true;
    } catch {
      return false;
    }
  }

  /** Returns stats for a path. */
  static async stat(rawPath: string) {
    const resolved = PathValidator.validate(rawPath);
    return fs.stat(resolved);
  }
}
