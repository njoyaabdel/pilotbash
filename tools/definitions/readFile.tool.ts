import { z } from 'zod';
import type { BaseTool } from '../BaseTool';
import { makeSuccess, makeError } from '../BaseTool';
import { InputSanitizer } from '@/services/security/InputSanitizer';
import { CommandGuard } from '@/services/security/CommandGuard';
import { FileSystemService } from '@/services/filesystem/FileSystemService';
import { AppError } from '@/lib/errors/AppError';
import { MAX_FILE_SIZE, MAX_FILE_SIZE_LABEL } from '@/lib/constants';
import type { ToolResult, FileReadResult } from '@/types';

const InputSchema = z.object({
  path: z.string().min(1, 'Path is required'),
});

type Input = z.infer<typeof InputSchema>;

export const readFileTool: BaseTool<Input, FileReadResult> = {
  name: 'read_file',
  description:
    'Reads and returns the text content of a file. Refuses files larger than ' +
    MAX_FILE_SIZE_LABEL + '.',

  async execute(input: Input): Promise<ToolResult<FileReadResult>> {
    const start = Date.now();

    try {
      const parsed = InputSchema.safeParse(input);
      if (!parsed.success) {
        return makeError(parsed.error.errors[0]?.message ?? 'Invalid input', start);
      }

      CommandGuard.validateCommand('cat');
      InputSanitizer.assertSafe(parsed.data.path, 'path');

      // Stat first (cheap) so we never load an oversized file into memory just to reject it.
      const stats = await FileSystemService.stat(parsed.data.path);

      if (stats.isDirectory()) {
        return makeError(`"${input.path}" is a directory, not a file.`, start);
      }

      if (stats.size > MAX_FILE_SIZE) {
        return makeError(
          `File is too large (${(stats.size / 1024 / 1024).toFixed(1)} MB). Maximum allowed size is ${MAX_FILE_SIZE_LABEL}.`,
          start
        );
      }

      const { content, size, resolvedPath, buffer } = await FileSystemService.readFile(parsed.data.path);

      // Detect if file looks like binary content
      const isBinary = buffer.some(
        (byte) => byte === 0 || (byte < 8 && byte !== 0x09 && byte !== 0x0a && byte !== 0x0d)
      );

      if (isBinary) {
        return makeError('Binary files are not supported. Only text files can be read.', start);
      }

      return makeSuccess({ path: resolvedPath, content, size, encoding: 'utf-8' }, start);
    } catch (err) {
      if (err instanceof AppError) return makeError(err.userMessage, start);
      if ((err as NodeJS.ErrnoException).code === 'ENOENT')
        return makeError(`File not found: ${input.path}`, start);
      if ((err as NodeJS.ErrnoException).code === 'EACCES')
        return makeError(`Permission denied: ${input.path}`, start);
      return makeError('Failed to read file.', start);
    }
  },
};
