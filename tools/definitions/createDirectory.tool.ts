import { z } from 'zod';
import type { BaseTool } from '../BaseTool';
import { makeSuccess, makeError } from '../BaseTool';
import { InputSanitizer } from '@/services/security/InputSanitizer';
import { CommandGuard } from '@/services/security/CommandGuard';
import { FileSystemService } from '@/services/filesystem/FileSystemService';
import { AppError } from '@/lib/errors/AppError';
import type { ToolResult, OperationResult } from '@/types';

const InputSchema = z.object({
  path: z.string().min(1, 'Path is required'),
});

type Input = z.infer<typeof InputSchema>;

export const createDirectoryTool: BaseTool<Input, OperationResult> = {
  name: 'create_directory',
  description:
    'Creates a new directory at the given path (recursively). ' +
    'Idempotent: succeeds even if the directory already exists.',

  async execute(input: Input): Promise<ToolResult<OperationResult>> {
    const start = Date.now();

    try {
      const parsed = InputSchema.safeParse(input);
      if (!parsed.success) {
        return makeError(parsed.error.errors[0]?.message ?? 'Invalid input', start);
      }

      CommandGuard.validateCommand('mkdir');
      InputSanitizer.assertSafe(parsed.data.path, 'path');

      const validPath = await FileSystemService.createDirectory(parsed.data.path);

      return makeSuccess(
        { success: true, message: `Directory created: ${validPath}`, path: validPath },
        start
      );
    } catch (err) {
      if (err instanceof AppError) return makeError(err.userMessage, start);
      if ((err as NodeJS.ErrnoException).code === 'EACCES')
        return makeError(`Permission denied: ${input.path}`, start);
      return makeError('Failed to create directory.', start);
    }
  },
};
