import { ToolRegistry } from './ToolRegistry';
import { listDirectoryTool } from './definitions/listDirectory.tool';
import { currentDirectoryTool } from './definitions/currentDirectory.tool';
import { readFileTool } from './definitions/readFile.tool';
import { createFileTool } from './definitions/createFile.tool';
import { createDirectoryTool } from './definitions/createDirectory.tool';
import { moveFileTool } from './definitions/moveFile.tool';
import { renameFileTool } from './definitions/renameFile.tool';
import { deleteFileTool } from './definitions/deleteFile.tool';

let registered = false;

/**
 * Registers all tools into the ToolRegistry.
 * Safe to call multiple times — idempotent.
 */
export function registerAllTools(): void {
  if (registered) return;

  ToolRegistry.register(listDirectoryTool);
  ToolRegistry.register(currentDirectoryTool);
  ToolRegistry.register(readFileTool);
  ToolRegistry.register(createFileTool);
  ToolRegistry.register(createDirectoryTool);
  ToolRegistry.register(moveFileTool);
  ToolRegistry.register(renameFileTool);
  ToolRegistry.register(deleteFileTool);

  registered = true;
}
