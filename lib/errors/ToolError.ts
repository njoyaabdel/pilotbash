import { AppError } from './AppError';

export class ToolError extends AppError {
  constructor(toolName: string, message: string, details?: unknown) {
    super(
      'TOOL_ERROR',
      `[${toolName}] ${message}`,
      `An error occurred while executing the tool "${toolName}". ${message}`,
      details
    );
    this.name = 'ToolError';
  }
}

export class PathError extends AppError {
  public readonly path: string;

  constructor(path: string, reason: string) {
    super(
      'PATH_ERROR',
      `Invalid path "${path}": ${reason}`,
      `The path "${path}" is invalid or inaccessible. ${reason}`,
      { path }
    );
    this.name = 'PathError';
    this.path = path;
  }
}

export class PermissionError extends AppError {
  constructor(path: string) {
    super(
      'PERMISSION_ERROR',
      `Permission denied for path "${path}"`,
      `You don't have permission to access "${path}".`,
      { path }
    );
    this.name = 'PermissionError';
  }
}

export class CommandDeniedError extends AppError {
  public readonly command: string;

  constructor(command: string) {
    super(
      'COMMAND_DENIED',
      `Command "${command}" is not allowed`,
      `The command "${command}" is blocked for security reasons.`,
      { command }
    );
    this.name = 'CommandDeniedError';
    this.command = command;
  }
}
