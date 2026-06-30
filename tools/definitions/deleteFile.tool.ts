import { z } from 'zod';
import type { BaseTool } from '../BaseTool';
import { makeSuccess, makeError } from '../BaseTool';
import { PathValidator } from '@/services/security/PathValidator';
import { InputSanitizer } from '@/services/security/InputSanitizer';
import { ConfirmationService } from '@/services/security/ConfirmationService';
import { FileSystemService } from '@/services/filesystem/FileSystemService';
import { AppError } from '@/lib/errors/AppError';
import type { ToolResult, OperationResult } from '@/types';

const InputSchema = z.object({
  path: z.string().min(1, 'Path is required'),
  confirmationToken: z.string().optional(),
});

type Input = z.infer<typeof InputSchema>;

export const deleteFileTool: BaseTool<Input, OperationResult> = {
  name: 'delete_file',
  description:
    'Deletes a file at the given path. IMPORTANT: This action requires a ' +
    'confirmation token. On the first call (without confirmationToken), the tool ' +
    'returns a token that the user must explicitly confirm before deletion proceeds.',
  // Note: deliberately not gated by CommandGuard ("rm" is blacklisted there).
  // Protection for this destructive action comes from ConfirmationService instead.

  async execute(input: Input): Promise<ToolResult<OperationResult>> {
    const start = Date.now();

    try {
      const parsed = InputSchema.safeParse(input);
      if (!parsed.success) {
        return makeError(parsed.error.errors[0]?.message ?? 'Invalid input', start);
      }

      const { confirmationToken } = parsed.data;
      InputSanitizer.assertSafe(parsed.data.path, 'path');
      // Resolved here (rather than only inside FileSystemService) because the
      // same resolved path must be used consistently for both confirmation
      // token creation and validation.
      const validPath = PathValidator.validate(parsed.data.path);

      // Verify file exists
      const fileExists = await FileSystemService.exists(validPath);
      if (!fileExists) {
        return makeError(`File not found: ${parsed.data.path}`, start);
      }

      // First call: no token — generate one and request confirmation
      if (!confirmationToken) {
        const token = ConfirmationService.create('delete_file', validPath);
        return {
          success: false,
          error: 'CONFIRMATION_REQUIRED',
          data: undefined,
          executedAt: new Date(),
          duration: Date.now() - start,
          requiresConfirmation: true,
          confirmationToken: token,
        };
      }

      // Second call: validate token
      const isValid = ConfirmationService.validate(confirmationToken, 'delete_file', validPath);
      if (!isValid) {
        return makeError(
          'Invalid or expired confirmation token. Please restart the delete operation.',
          start
        );
      }

      await FileSystemService.deleteFile(validPath);

      return makeSuccess(
        { success: true, message: `Deleted: ${validPath}`, path: validPath },
        start
      );
    } catch (err) {
      if (err instanceof AppError) return makeError(err.userMessage, start);
      if ((err as NodeJS.ErrnoException).code === 'EACCES')
        return makeError('Permission denied.', start);
      return makeError('Failed to delete file.', start);
    }
  },
};
