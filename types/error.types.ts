export type AppErrorCode =
  | 'TOOL_ERROR'
  | 'PATH_ERROR'
  | 'PERMISSION_ERROR'
  | 'COMMAND_DENIED'
  | 'VALIDATION_ERROR'
  | 'FILE_TOO_LARGE'
  | 'FILE_NOT_FOUND'
  | 'DIRECTORY_NOT_FOUND'
  | 'PATH_TRAVERSAL'
  | 'TIMEOUT'
  | 'UNKNOWN';

export interface AppErrorData {
  code: AppErrorCode;
  message: string;
  userMessage: string;
  details?: unknown;
}
