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
  path: z.string().min(1, 'Path is required'),
  content: z.string(),
  overwrite: z.boolean().optional().default(false),
});

type Input = z.infer<typeof InputSchema>;

export const createFileTool: BaseTool<Input, OperationResult> = {
  name: 'create_file',
  description:
    'Creates a new file at the given path with the provided text content. ' +
    'Refuses to overwrite an existing file unless overwrite is explicitly set to true.',

  async execute(input: Input): Promise<ToolResult<OperationResult>> {
    const start = Date.now();

    try {
      const parsed = InputSchema.safeParse(input);
      if (!parsed.success) {
        return makeError(parsed.error.errors[0]?.message ?? 'Invalid input', start);
      }

      const { path: rawPath, content, overwrite } = parsed.data;
      CommandGuard.validateCommand('touch');
      InputSanitizer.assertSafe(rawPath, 'path');
      // Resolved here (rather than only inside FileSystemService) because we need
      // it up front for the parent-directory check and for clear error messages.
      const validPath = PathValidator.validate(rawPath);

      // Ensure parent directory exists
      const parentDir = path.dirname(validPath);
      const parentExists = await FileSystemService.exists(parentDir);
      if (!parentExists) {
        return makeError(
          `Parent directory does not exist: ${parentDir}. Create it first.`,
          start
        );
      }

      // Refuse overwrite unless explicitly allowed
      if (!overwrite) {
        const fileExists = await FileSystemService.exists(validPath);
        if (fileExists) {
          return makeError(
            `File already exists: ${validPath}. Pass overwrite: true to replace it.`,
            start
          );
        }
      }

      // Note: content is written exactly as received — it is never sanitized/trimmed,
      // since it is not a path and is never interpreted as a command (see point 2).
      await FileSystemService.writeFile(validPath, content);

      return makeSuccess(
        { success: true, message: `File created: ${validPath}`, path: validPath },
        start
      );
    } catch (err) {
      if (err instanceof AppError) return makeError(err.userMessage, start);
      if ((err as NodeJS.ErrnoException).code === 'EACCES')
        return makeError(`Permission denied: ${input.path}`, start);
      return makeError('Failed to create file.', start);
    }
  },
};
