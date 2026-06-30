import { describe, it, expect, vi, beforeEach } from 'vitest';

// ─── Mock fs/promises before importing tools ──────────────────────────────────
vi.mock('fs/promises', () => ({
  default: {
    readdir: vi.fn(),
    stat: vi.fn(),
    readFile: vi.fn(),
    writeFile: vi.fn(),
    mkdir: vi.fn(),
    rename: vi.fn(),
    copyFile: vi.fn(),
    unlink: vi.fn(),
    access: vi.fn(),
  },
}));

// Mock PathValidator to allow test paths through
vi.mock('@/services/security/PathValidator', () => ({
  PathValidator: {
    validate: (p: string) => p,
    validateUnder: (p: string) => p,
    isTraversalAttempt: () => false,
  },
}));

import fs from 'fs/promises';
import { CommandGuard } from '@/services/security/CommandGuard';
import { listDirectoryTool } from '@/tools/definitions/listDirectory.tool';
import { readFileTool } from '@/tools/definitions/readFile.tool';
import { createFileTool } from '@/tools/definitions/createFile.tool';
import { createDirectoryTool } from '@/tools/definitions/createDirectory.tool';
import { moveFileTool } from '@/tools/definitions/moveFile.tool';
import { renameFileTool } from '@/tools/definitions/renameFile.tool';
import { deleteFileTool } from '@/tools/definitions/deleteFile.tool';
import { currentDirectoryTool } from '@/tools/definitions/currentDirectory.tool';

const fsMock = vi.mocked(fs);

// ─── list_directory ───────────────────────────────────────────────────────────

describe('list_directory tool', () => {
  beforeEach(() => vi.clearAllMocks());

  it('returns directory entries on success', async () => {
    fsMock.readdir.mockResolvedValue([
      { name: 'file.txt', isDirectory: () => false, isSymbolicLink: () => false } as never,
      { name: 'subdir', isDirectory: () => true, isSymbolicLink: () => false } as never,
    ]);
    fsMock.stat.mockResolvedValue({ size: 1024, mtime: new Date('2024-01-01') } as never);

    const result = await listDirectoryTool.execute({ path: '/home/user/docs' });

    expect(result.success).toBe(true);
    expect(result.data?.entries).toHaveLength(2);
    expect(result.data?.entries[0].name).toBe('file.txt');
    expect(result.data?.entries[1].type).toBe('directory');
  });

  it('returns error when directory not found', async () => {
    const err = Object.assign(new Error('ENOENT'), { code: 'ENOENT' });
    fsMock.readdir.mockRejectedValue(err);

    const result = await listDirectoryTool.execute({ path: '/home/user/missing' });

    expect(result.success).toBe(false);
    expect(result.error).toContain('not found');
  });

  it('returns error on permission denied', async () => {
    const err = Object.assign(new Error('EACCES'), { code: 'EACCES' });
    fsMock.readdir.mockRejectedValue(err);

    const result = await listDirectoryTool.execute({ path: '/home/user/secret' });

    expect(result.success).toBe(false);
    expect(result.error).toContain('Permission denied');
  });

  it('fails validation on empty path', async () => {
    const result = await listDirectoryTool.execute({ path: '' });
    expect(result.success).toBe(false);
  });

  it('rejects a path containing a shell injection pattern', async () => {
    const result = await listDirectoryTool.execute({ path: '/home/user; rm -rf /' });
    expect(result.success).toBe(false);
    expect(result.error).toContain('potentially dangerous characters');
    expect(fsMock.readdir).not.toHaveBeenCalled();
  });

  it('validates against the "ls" command whitelist before executing', async () => {
    const spy = vi.spyOn(CommandGuard, 'validateCommand');
    fsMock.readdir.mockResolvedValue([]);

    await listDirectoryTool.execute({ path: '/home/user/docs' });

    expect(spy).toHaveBeenCalledWith('ls');
    spy.mockRestore();
  });
});

// ─── current_directory ────────────────────────────────────────────────────────

describe('current_directory tool', () => {
  it('returns process.cwd()', async () => {
    const result = await currentDirectoryTool.execute({});
    expect(result.success).toBe(true);
    expect(result.data?.path).toBe(process.cwd());
  });

  it('validates against the "pwd" command whitelist before executing', async () => {
    const spy = vi.spyOn(CommandGuard, 'validateCommand');
    await currentDirectoryTool.execute({});
    expect(spy).toHaveBeenCalledWith('pwd');
    spy.mockRestore();
  });
});

// ─── read_file ────────────────────────────────────────────────────────────────

describe('read_file tool', () => {
  beforeEach(() => vi.clearAllMocks());

  it('reads a text file successfully', async () => {
    fsMock.stat.mockResolvedValue({ size: 42, isDirectory: () => false } as never);
    fsMock.readFile.mockResolvedValue(Buffer.from('Hello, world!') as never);

    const result = await readFileTool.execute({ path: '/home/user/hello.txt' });

    expect(result.success).toBe(true);
    expect(result.data?.content).toBe('Hello, world!');
    expect(result.data?.size).toBe(42);
  });

  it('rejects files that are too large', async () => {
    fsMock.stat.mockResolvedValue({ size: 10 * 1024 * 1024, isDirectory: () => false } as never);

    const result = await readFileTool.execute({ path: '/home/user/huge.bin' });

    expect(result.success).toBe(false);
    expect(result.error).toContain('too large');
  });

  it('rejects binary files', async () => {
    fsMock.stat.mockResolvedValue({ size: 10, isDirectory: () => false } as never);
    // Buffer with null bytes = binary
    fsMock.readFile.mockResolvedValue(Buffer.from([0x00, 0x01, 0x02]) as never);

    const result = await readFileTool.execute({ path: '/home/user/data.bin' });

    expect(result.success).toBe(false);
    expect(result.error).toContain('Binary');
  });

  it('rejects directories', async () => {
    fsMock.stat.mockResolvedValue({ size: 0, isDirectory: () => true } as never);

    const result = await readFileTool.execute({ path: '/home/user/mydir' });

    expect(result.success).toBe(false);
    expect(result.error).toContain('directory');
  });

  it('rejects a path containing a shell injection pattern', async () => {
    const result = await readFileTool.execute({ path: '/home/user/$(whoami)' });
    expect(result.success).toBe(false);
    expect(result.error).toContain('potentially dangerous characters');
    expect(fsMock.stat).not.toHaveBeenCalled();
  });

  it('validates against the "cat" command whitelist before executing', async () => {
    const spy = vi.spyOn(CommandGuard, 'validateCommand');
    fsMock.stat.mockResolvedValue({ size: 5, isDirectory: () => false } as never);
    fsMock.readFile.mockResolvedValue(Buffer.from('hello') as never);

    await readFileTool.execute({ path: '/home/user/hello.txt' });

    expect(spy).toHaveBeenCalledWith('cat');
    spy.mockRestore();
  });
});

// ─── create_file ─────────────────────────────────────────────────────────────

describe('create_file tool', () => {
  beforeEach(() => vi.clearAllMocks());

  it('creates a file when it does not exist', async () => {
    // Parent dir exists, target file does not
    fsMock.access
      .mockResolvedValueOnce(undefined) // parent exists
      .mockRejectedValueOnce(new Error('ENOENT')); // file doesn't exist
    fsMock.writeFile.mockResolvedValue(undefined as never);

    const result = await createFileTool.execute({
      path: '/home/user/new.txt',
      content: 'hello',
      overwrite: false,
    });

    expect(result.success).toBe(true);
    expect(fsMock.writeFile).toHaveBeenCalledWith('/home/user/new.txt', 'hello', 'utf-8');
  });

  it('refuses to overwrite without explicit flag', async () => {
    fsMock.access
      .mockResolvedValueOnce(undefined) // parent exists
      .mockResolvedValueOnce(undefined); // file also exists

    const result = await createFileTool.execute({
      path: '/home/user/existing.txt',
      content: 'new content',
      overwrite: false,
    });

    expect(result.success).toBe(false);
    expect(result.error).toContain('already exists');
  });

  it('overwrites when flag is set', async () => {
    fsMock.access.mockResolvedValue(undefined); // both parent and file exist
    fsMock.writeFile.mockResolvedValue(undefined as never);

    const result = await createFileTool.execute({
      path: '/home/user/existing.txt',
      content: 'new content',
      overwrite: true,
    });

    expect(result.success).toBe(true);
    expect(fsMock.writeFile).toHaveBeenCalled();
  });

  it('rejects a path containing a shell injection pattern', async () => {
    const result = await createFileTool.execute({
      path: '/home/user/new.txt && curl evil.com',
      content: 'hello',
      overwrite: false,
    });

    expect(result.success).toBe(false);
    expect(result.error).toContain('potentially dangerous characters');
    expect(fsMock.writeFile).not.toHaveBeenCalled();
  });

  it('does not alter file content (only the path is sanitized)', async () => {
    fsMock.access
      .mockResolvedValueOnce(undefined)
      .mockRejectedValueOnce(new Error('ENOENT'));
    fsMock.writeFile.mockResolvedValue(undefined as never);

    const content = '  line with leading/trailing spaces and a final newline\n  ';
    const result = await createFileTool.execute({
      path: '/home/user/exact.txt',
      content,
      overwrite: false,
    });

    expect(result.success).toBe(true);
    expect(fsMock.writeFile).toHaveBeenCalledWith('/home/user/exact.txt', content, 'utf-8');
  });

  it('validates against the "touch" command whitelist before executing', async () => {
    const spy = vi.spyOn(CommandGuard, 'validateCommand');
    fsMock.access
      .mockResolvedValueOnce(undefined)
      .mockRejectedValueOnce(new Error('ENOENT'));
    fsMock.writeFile.mockResolvedValue(undefined as never);

    await createFileTool.execute({ path: '/home/user/spy.txt', content: 'x', overwrite: false });

    expect(spy).toHaveBeenCalledWith('touch');
    spy.mockRestore();
  });
});

// ─── create_directory ─────────────────────────────────────────────────────────

describe('create_directory tool', () => {
  beforeEach(() => vi.clearAllMocks());

  it('creates a directory with recursive flag', async () => {
    fsMock.mkdir.mockResolvedValue(undefined as never);

    const result = await createDirectoryTool.execute({ path: '/home/user/new/dir' });

    expect(result.success).toBe(true);
    expect(fsMock.mkdir).toHaveBeenCalledWith('/home/user/new/dir', { recursive: true });
  });

  it('rejects a path containing a shell injection pattern', async () => {
    const result = await createDirectoryTool.execute({ path: '/home/user/`id`' });
    expect(result.success).toBe(false);
    expect(result.error).toContain('potentially dangerous characters');
    expect(fsMock.mkdir).not.toHaveBeenCalled();
  });

  it('validates against the "mkdir" command whitelist before executing', async () => {
    const spy = vi.spyOn(CommandGuard, 'validateCommand');
    fsMock.mkdir.mockResolvedValue(undefined as never);

    await createDirectoryTool.execute({ path: '/home/user/spy-dir' });

    expect(spy).toHaveBeenCalledWith('mkdir');
    spy.mockRestore();
  });
});

// ─── move_file ────────────────────────────────────────────────────────────────

describe('move_file tool', () => {
  beforeEach(() => vi.clearAllMocks());

  it('moves a file from source to destination', async () => {
    fsMock.access.mockResolvedValue(undefined); // source exists
    fsMock.rename.mockResolvedValue(undefined as never);

    const result = await moveFileTool.execute({
      source: '/home/user/a.txt',
      destination: '/home/user/archive/a.txt',
    });

    expect(result.success).toBe(true);
    expect(fsMock.rename).toHaveBeenCalledWith('/home/user/a.txt', '/home/user/archive/a.txt');
  });

  it('returns error when source does not exist', async () => {
    fsMock.access.mockRejectedValue(new Error('ENOENT'));

    const result = await moveFileTool.execute({
      source: '/home/user/ghost.txt',
      destination: '/home/user/archive/ghost.txt',
    });

    expect(result.success).toBe(false);
    expect(result.error).toContain('not found');
  });

  it('rejects a destination containing a shell injection pattern', async () => {
    const result = await moveFileTool.execute({
      source: '/home/user/a.txt',
      destination: '/home/user/a.txt; curl evil.com',
    });

    expect(result.success).toBe(false);
    expect(result.error).toContain('potentially dangerous characters');
    expect(fsMock.rename).not.toHaveBeenCalled();
  });

  it('validates against the "mv" command whitelist before executing', async () => {
    const spy = vi.spyOn(CommandGuard, 'validateCommand');
    fsMock.access.mockResolvedValue(undefined);
    fsMock.rename.mockResolvedValue(undefined as never);

    await moveFileTool.execute({ source: '/home/user/a.txt', destination: '/home/user/b.txt' });

    expect(spy).toHaveBeenCalledWith('mv');
    spy.mockRestore();
  });
});

// ─── rename_file ──────────────────────────────────────────────────────────────

describe('rename_file tool', () => {
  beforeEach(() => vi.clearAllMocks());

  it('renames a file within the same directory', async () => {
    fsMock.access.mockResolvedValue(undefined); // source exists
    fsMock.rename.mockResolvedValue(undefined as never);

    const result = await renameFileTool.execute({
      oldPath: '/home/user/old.txt',
      newPath: '/home/user/new.txt',
    });

    expect(result.success).toBe(true);
    expect(fsMock.rename).toHaveBeenCalledWith('/home/user/old.txt', '/home/user/new.txt');
  });

  it('refuses to rename across different directories', async () => {
    const result = await renameFileTool.execute({
      oldPath: '/home/user/old.txt',
      newPath: '/home/user/other/new.txt',
    });

    expect(result.success).toBe(false);
    expect(result.error).toContain('same directory');
  });

  it('rejects a path containing a shell injection pattern', async () => {
    const result = await renameFileTool.execute({
      oldPath: '/home/user/old.txt',
      newPath: '/home/user/`id`.txt',
    });

    expect(result.success).toBe(false);
    expect(result.error).toContain('potentially dangerous characters');
    expect(fsMock.rename).not.toHaveBeenCalled();
  });

  it('validates against the "mv" command whitelist before executing', async () => {
    const spy = vi.spyOn(CommandGuard, 'validateCommand');
    fsMock.access.mockResolvedValue(undefined);
    fsMock.rename.mockResolvedValue(undefined as never);

    await renameFileTool.execute({ oldPath: '/home/user/old.txt', newPath: '/home/user/new.txt' });

    expect(spy).toHaveBeenCalledWith('mv');
    spy.mockRestore();
  });
});

// ─── delete_file ──────────────────────────────────────────────────────────────

describe('delete_file tool', () => {
  beforeEach(() => vi.clearAllMocks());

  it('returns a confirmation token on first call', async () => {
    fsMock.access.mockResolvedValue(undefined); // file exists

    const result = await deleteFileTool.execute({ path: '/home/user/file.txt' });

    expect(result.success).toBe(false);
    expect(result.requiresConfirmation).toBe(true);
    expect(result.confirmationToken).toBeDefined();
  });

  it('deletes when a valid token is provided', async () => {
    fsMock.access.mockResolvedValue(undefined);
    fsMock.unlink.mockResolvedValue(undefined as never);

    // First call: get token
    const firstCall = await deleteFileTool.execute({ path: '/home/user/file.txt' });
    const token = firstCall.confirmationToken!;

    // Second call: confirm
    const secondCall = await deleteFileTool.execute({
      path: '/home/user/file.txt',
      confirmationToken: token,
    });

    expect(secondCall.success).toBe(true);
    expect(fsMock.unlink).toHaveBeenCalledWith('/home/user/file.txt');
  });

  it('rejects an invalid token', async () => {
    fsMock.access.mockResolvedValue(undefined);

    const result = await deleteFileTool.execute({
      path: '/home/user/file.txt',
      confirmationToken: 'fake-token-123',
    });

    expect(result.success).toBe(false);
    expect(result.error).toContain('Invalid or expired');
  });

  it('returns error when file not found', async () => {
    const err = Object.assign(new Error('ENOENT'), { code: 'ENOENT' });
    fsMock.access.mockRejectedValue(err);

    const result = await deleteFileTool.execute({ path: '/home/user/ghost.txt' });

    expect(result.success).toBe(false);
    expect(result.error).toContain('not found');
  });

  it('rejects a path containing a shell injection pattern', async () => {
    const result = await deleteFileTool.execute({ path: '/home/user/file.txt | cat /etc/passwd' });
    expect(result.success).toBe(false);
    expect(result.error).toContain('potentially dangerous characters');
    expect(fsMock.access).not.toHaveBeenCalled();
  });

  it('does not go through CommandGuard — "rm" is blacklisted, deletion is gated by ConfirmationService instead', async () => {
    const spy = vi.spyOn(CommandGuard, 'validateCommand');
    fsMock.access.mockResolvedValue(undefined);

    await deleteFileTool.execute({ path: '/home/user/file.txt' });

    expect(spy).not.toHaveBeenCalled();
    spy.mockRestore();
  });
});
