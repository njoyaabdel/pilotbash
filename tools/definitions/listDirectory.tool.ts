import { z } from 'zod';
import type { BaseTool } from '../BaseTool';
import { makeSuccess, makeError } from '../BaseTool';
import { InputSanitizer } from '@/services/security/InputSanitizer';
import { CommandGuard } from '@/services/security/CommandGuard';
import { FileSystemService } from '@/services/filesystem/FileSystemService';
import { AppError } from '@/lib/errors/AppError';
import type { ToolResult, DirectoryListResult } from '@/types';

const InputSchema = z.object({
  path: z.string().min(1, 'Path is required'),
});

type Input = z.infer<typeof InputSchema>;

export const listDirectoryTool: BaseTool<Input, DirectoryListResult> = {
  name: 'list_directory',
  description:
    'Lists the files and directories inside a given path. Returns name, type (file/directory/symlink), size, and last modification date for each entry.',

  async execute(input: Input): Promise<ToolResult<DirectoryListResult>> {
    const start = Date.now();

    try {
      const parsed = InputSchema.safeParse(input);
      if (!parsed.success) {
        return makeError(parsed.error.errors[0]?.message ?? 'Invalid input', start);
      }

      CommandGuard.validateCommand('ls');
      InputSanitizer.assertSafe(parsed.data.path, 'path');

      const { entries, resolvedPath } = await FileSystemService.listDirectory(parsed.data.path);

      return makeSuccess({ path: resolvedPath, entries, totalEntries: entries.length }, start);
    } catch (err) {
      if (err instanceof AppError) return makeError(err.userMessage, start);
      if ((err as NodeJS.ErrnoException).code === 'ENOENT')
        return makeError(`Directory not found: ${input.path}`, start);
      if ((err as NodeJS.ErrnoException).code === 'EACCES')
        return makeError(`Permission denied: ${input.path}`, start);
      return makeError('Failed to list directory.', start);
    }
  },
};
