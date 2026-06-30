import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ConfirmationService } from '@/services/security/ConfirmationService';

describe('ConfirmationService', () => {
  it('creates a token and validates it once', () => {
    const token = ConfirmationService.create('delete_file', '/home/user/file.txt');
    expect(token).toBeTruthy();
    expect(typeof token).toBe('string');
    expect(token.length).toBeGreaterThan(20);

    // First validation: should succeed
    const isValid = ConfirmationService.validate(token, 'delete_file', '/home/user/file.txt');
    expect(isValid).toBe(true);

    // Second validation: token consumed, should fail
    const isValidAgain = ConfirmationService.validate(token, 'delete_file', '/home/user/file.txt');
    expect(isValidAgain).toBe(false);
  });

  it('rejects a token for a different action', () => {
    const token = ConfirmationService.create('delete_file', '/home/user/file.txt');
    const isValid = ConfirmationService.validate(token, 'move_file', '/home/user/file.txt');
    expect(isValid).toBe(false);
  });

  it('rejects a token for a different path', () => {
    const token = ConfirmationService.create('delete_file', '/home/user/file.txt');
    const isValid = ConfirmationService.validate(token, 'delete_file', '/home/user/other.txt');
    expect(isValid).toBe(false);
  });

  it('rejects a completely fake token', () => {
    const isValid = ConfirmationService.validate('not-a-real-token', 'delete_file', '/home/user/file.txt');
    expect(isValid).toBe(false);
  });

  it('reports pending status correctly', () => {
    const token = ConfirmationService.create('delete_file', '/home/user/file.txt');
    expect(ConfirmationService.isPending(token)).toBe(true);

    // After consuming it
    ConfirmationService.validate(token, 'delete_file', '/home/user/file.txt');
    expect(ConfirmationService.isPending(token)).toBe(false);
  });
});
