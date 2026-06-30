import type { BaseTool } from '../BaseTool';
import { makeSuccess, makeError } from '../BaseTool';
import { CommandGuard } from '@/services/security/CommandGuard';
import { AppError } from '@/lib/errors/AppError';
import type { ToolResult } from '@/types';

interface CurrentDirectoryResult {
  path: string;
}

export const currentDirectoryTool: BaseTool<Record<string, never>, CurrentDirectoryResult> = {
  name: 'current_directory',
  description: 'Returns the current working directory of the server process.',

  async execute(): Promise<ToolResult<CurrentDirectoryResult>> {
    const start = Date.now();
    try {
      CommandGuard.validateCommand('pwd');
      return makeSuccess({ path: process.cwd() }, start);
    } catch (err) {
      if (err instanceof AppError) return makeError(err.userMessage, start);
      return makeError('Failed to resolve current directory.', start);
    }
  },
};
