import path from 'path';
import { z } from 'zod';
import type { BaseTool } from '../BaseTool';
import { makeSuccess, makeError } from '../BaseTool';
import { PathValidator } from '@/services/security/PathValidator';
import { InputSanitizer } from '@/services/security/InputSanitizer';
import { CommandGuard } from '@/services/security/CommandGuard';
import { FileSystemService } from '@/services/filesystem/FileSystemService';
import { AppError } from '@/lib/errors/AppError';
import type { ToolResult, OperationResult } from '@/types';

const InputSchema = z.object({
  oldPath: z.string().min(1, 'Old path is required'),
  newPath: z.string().min(1, 'New path is required'),
});

type Input = z.infer<typeof InputSchema>;

export const renameFileTool: BaseTool<Input, OperationResult> = {
  name: 'rename_file',
  description:
    'Renames a file or directory within the same parent directory. ' +
    'Use move_file for cross-directory operations.',

  async execute(input: Input): Promise<ToolResult<OperationResult>> {
    const start = Date.now();

    try {
      const parsed = InputSchema.safeParse(input);
      if (!parsed.success) {
        return makeError(parsed.error.errors[0]?.message ?? 'Invalid input', start);
      }

      CommandGuard.validateCommand('mv');
      InputSanitizer.assertSafe(parsed.data.oldPath, 'oldPath');
      InputSanitizer.assertSafe(parsed.data.newPath, 'newPath');
      // Resolved here (rather than only inside FileSystemService) because the
      // same-directory check below needs both resolved paths up front.
      const oldValidPath = PathValidator.validate(parsed.data.oldPath);
      const newValidPath = PathValidator.validate(parsed.data.newPath);

      // Ensure both paths share the same parent directory
      if (path.dirname(oldValidPath) !== path.dirname(newValidPath)) {
        return makeError(
          'rename_file only works within the same directory. Use move_file to change directories.',
          start
        );
      }

      // Verify source exists (gives a clear message instead of a generic ENOENT failure)
      const sourceExists = await FileSystemService.exists(oldValidPath);
      if (!sourceExists) {
        return makeError(`Source not found: ${parsed.data.oldPath}`, start);
      }

      const { to } = await FileSystemService.move(oldValidPath, newValidPath);

      return makeSuccess(
        {
          success: true,
          message: `Renamed "${path.basename(oldValidPath)}" → "${path.basename(newValidPath)}"`,
          path: to,
        },
        start
      );
    } catch (err) {
      if (err instanceof AppError) return makeError(err.userMessage, start);
      if ((err as NodeJS.ErrnoException).code === 'EACCES')
        return makeError('Permission denied.', start);
      return makeError('Failed to rename file.', start);
    }
  },
};
