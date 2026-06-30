import crypto from 'crypto';
import { CONFIRMATION_TOKEN_TTL_MS } from '@/lib/constants';

interface PendingConfirmation {
  token: string;
  action: string;
  path: string;
  expiresAt: number;
}

/**
 * Manages confirmation tokens for destructive operations (e.g. delete_file).
 * Tokens are signed with HMAC-SHA256 and expire after CONFIRMATION_TOKEN_TTL_MS.
 *
 * In a production app this state would live in Redis or a similar store.
 * For this implementation it uses an in-memory Map (single-process only).
 */
export class ConfirmationService {
  private static readonly secret = process.env['CONFIRMATION_SECRET'] ?? crypto.randomBytes(32).toString('hex');
  private static pending = new Map<string, PendingConfirmation>();

  /**
   * Creates and stores a confirmation token for a destructive action.
   */
  static create(action: string, path: string): string {
    const payload = `${action}:${path}:${Date.now()}`;
    const token = crypto
      .createHmac('sha256', ConfirmationService.secret)
      .update(payload)
      .digest('hex');

    ConfirmationService.pending.set(token, {
      token,
      action,
      path,
      expiresAt: Date.now() + CONFIRMATION_TOKEN_TTL_MS,
    });

    // Cleanup expired tokens lazily
    ConfirmationService.cleanup();

    return token;
  }

  /**
   * Validates a token, removing it once consumed (one-time use).
   */
  static validate(token: string, action: string, path: string): boolean {
    const record = ConfirmationService.pending.get(token);
    if (!record) return false;
    if (Date.now() > record.expiresAt) {
      ConfirmationService.pending.delete(token);
      return false;
    }
    if (record.action !== action || record.path !== path) return false;

    // Consume the token
    ConfirmationService.pending.delete(token);
    return true;
  }

  /** Returns true if the token exists and is not yet expired. */
  static isPending(token: string): boolean {
    const record = ConfirmationService.pending.get(token);
    if (!record) return false;
    return Date.now() <= record.expiresAt;
  }

  private static cleanup(): void {
    const now = Date.now();
    for (const [key, record] of ConfirmationService.pending.entries()) {
      if (now > record.expiresAt) {
        ConfirmationService.pending.delete(key);
      }
    }
  }
}
