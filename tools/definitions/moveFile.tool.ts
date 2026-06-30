import { z } from 'zod';
import type { BaseTool } from '../BaseTool';
import { makeSuccess, makeError } from '../BaseTool';
import { InputSanitizer } from '@/services/security/InputSanitizer';
import { CommandGuard } from '@/services/security/CommandGuard';
import { FileSystemService } from '@/services/filesystem/FileSystemService';
import { AppError } from '@/lib/errors/AppError';
import type { ToolResult, OperationResult } from '@/types';

const InputSchema = z.object({
  source: z.string().min(1, 'Source path is required'),
  destination: z.string().min(1, 'Destination path is required'),
});

type Input = z.infer<typeof InputSchema>;

export const moveFileTool: BaseTool<Input, OperationResult> = {
  name: 'move_file',
  description:
    'Moves a file or directory from source to destination. ' +
    'Handles cross-device moves gracefully (copy then delete fallback).',

  async execute(input: Input): Promise<ToolResult<OperationResult>> {
    const start = Date.now();

    try {
      const parsed = InputSchema.safeParse(input);
      if (!parsed.success) {
        return makeError(parsed.error.errors[0]?.message ?? 'Invalid input', start);
      }

      CommandGuard.validateCommand('mv');
      InputSanitizer.assertSafe(parsed.data.source, 'source');
      InputSanitizer.assertSafe(parsed.data.destination, 'destination');

      // Verify source exists (gives a clear message instead of a generic ENOENT failure)
      const sourceExists = await FileSystemService.exists(parsed.data.source);
      if (!sourceExists) {
        return makeError(`Source not found: ${parsed.data.source}`, start);
      }

      const { to } = await FileSystemService.move(parsed.data.source, parsed.data.destination);

      return makeSuccess(
        {
          success: true,
          message: `Moved "${parsed.data.source}" → "${parsed.data.destination}"`,
          path: to,
        },
        start
      );
    } catch (err) {
      if (err instanceof AppError) return makeError(err.userMessage, start);
      if ((err as NodeJS.ErrnoException).code === 'EACCES')
        return makeError('Permission denied.', start);
      return makeError('Failed to move file.', start);
    }
  },
};
