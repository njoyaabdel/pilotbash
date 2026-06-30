import type { AppErrorCode } from '@/types';

export class AppError extends Error {
  public readonly code: AppErrorCode;
  public readonly userMessage: string;
  public readonly details?: unknown;

  constructor(
    code: AppErrorCode,
    message: string,
    userMessage: string,
    details?: unknown
  ) {
    super(message);
    this.name = 'AppError';
    this.code = code;
    this.userMessage = userMessage;
    this.details = details;
    Object.setPrototypeOf(this, new.target.prototype);
  }
}
