import { describe, it, expect, beforeEach } from 'vitest';
import { ToolRegistry } from '@/tools/ToolRegistry';
import type { BaseTool } from '@/tools/BaseTool';
import type { ToolResult } from '@/types';

const mockTool: BaseTool<{ input: string }, string> = {
  name: 'mock_tool',
  description: 'A mock tool for testing',
  execute: async (input): Promise<ToolResult<string>> => ({
    success: true,
    data: `echo: ${input.input}`,
    executedAt: new Date(),
    duration: 0,
  }),
};

describe('ToolRegistry', () => {
  beforeEach(() => {
    ToolRegistry.clear();
  });

  it('registers and resolves a tool by name', () => {
    ToolRegistry.register(mockTool);
    const resolved = ToolRegistry.resolve('mock_tool');
    expect(resolved).toBe(mockTool);
  });

  it('throws when registering a duplicate tool name', () => {
    ToolRegistry.register(mockTool);
    expect(() => ToolRegistry.register(mockTool)).toThrow('already registered');
  });

  it('throws when resolving an unknown tool', () => {
    expect(() => ToolRegistry.resolve('unknown')).toThrow('not registered');
  });

  it('returns all registered tools', () => {
    ToolRegistry.register(mockTool);
    const all = ToolRegistry.getAll();
    expect(all).toHaveLength(1);
    expect(all[0].name).toBe('mock_tool');
  });

  it('checks existence with has()', () => {
    expect(ToolRegistry.has('mock_tool')).toBe(false);
    ToolRegistry.register(mockTool);
    expect(ToolRegistry.has('mock_tool')).toBe(true);
  });

  it('executes a registered tool correctly', async () => {
    ToolRegistry.register(mockTool);
    const tool = ToolRegistry.resolve<{ input: string }, string>('mock_tool');
    const result = await tool.execute({ input: 'hello' });
    expect(result.success).toBe(true);
    expect(result.data).toBe('echo: hello');
  });
});
