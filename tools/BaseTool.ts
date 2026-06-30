import type { ToolResult } from '@/types';

export interface BaseTool<TInput = unknown, TOutput = unknown> {
  readonly name: string;
  readonly description: string;
  execute(input: TInput): Promise<ToolResult<TOutput>>;
}

/** Helper to build a successful ToolResult with duration tracking. */
export function makeSuccess<T>(data: T, startTime: number): ToolResult<T> {
  return {
    success: true,
    data,
    executedAt: new Date(),
    duration: Date.now() - startTime,
  };
}

/** Helper to build a failed ToolResult. */
export function makeError(message: string, startTime: number): ToolResult<never> {
  return {
    success: false,
    error: message,
    executedAt: new Date(),
    duration: Date.now() - startTime,
  };
}
