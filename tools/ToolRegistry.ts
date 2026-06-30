import type { BaseTool } from './BaseTool';

/**
 * Registry pattern: a single source of truth for all registered tools.
 * Tools register themselves; consumers resolve by name.
 */
export class ToolRegistry {
  private static readonly tools = new Map<string, BaseTool>();

  static register<TInput, TOutput>(tool: BaseTool<TInput, TOutput>): void {
    if (ToolRegistry.tools.has(tool.name)) {
      throw new Error(`Tool "${tool.name}" is already registered.`);
    }
    ToolRegistry.tools.set(tool.name, tool);
  }

  static resolve<TInput = unknown, TOutput = unknown>(
    name: string
  ): BaseTool<TInput, TOutput> {
    const tool = ToolRegistry.tools.get(name);
    if (!tool) {
      throw new Error(`Tool "${name}" is not registered.`);
    }
    return tool as BaseTool<TInput, TOutput>;
  }

  static getAll(): BaseTool[] {
    return Array.from(ToolRegistry.tools.values());
  }

  static has(name: string): boolean {
    return ToolRegistry.tools.has(name);
  }

  static clear(): void {
    ToolRegistry.tools.clear();
  }
}
