export interface ToolResult<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  executedAt: Date;
  duration: number;
  requiresConfirmation?: boolean;
  confirmationToken?: string;
}

export interface ToolDefinition<TInput = unknown, TOutput = unknown> {
  name: string;
  description: string;
  execute(input: TInput): Promise<ToolResult<TOutput>>;
}

// Directory listing types
export interface DirectoryEntry {
  name: string;
  type: 'file' | 'directory' | 'symlink';
  size: number;
  modifiedAt: Date;
  path: string;
}

export interface DirectoryListResult {
  path: string;
  entries: DirectoryEntry[];
  totalEntries: number;
}

// File read types
export interface FileReadResult {
  path: string;
  content: string;
  size: number;
  encoding: string;
}

// Generic operation result
export interface OperationResult {
  success: boolean;
  message: string;
  path?: string;
}
