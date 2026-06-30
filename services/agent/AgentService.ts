import { streamText, tool } from 'ai';
import { createGoogleGenerativeAI } from '@ai-sdk/google';
import { z } from 'zod';
import { SYSTEM_PROMPT } from './systemPrompt';
import { registerAllTools } from '@/tools/registerTools';
import { ToolRegistry } from '@/tools/ToolRegistry';
import type { ToolResult } from '@/types';

// Ensure tools are registered before first use
registerAllTools();

const google = createGoogleGenerativeAI({
  apiKey: process.env['GOOGLE_GENERATIVE_AI_API_KEY'] ?? '',
});

// gemini-2.5-flash: stable (non-preview) model, eligible for the Gemini API free tier,
// good tool-calling support — a sensible default for local development.
const MODEL_ID = 'gemini-2.5-flash';

/**
 * Builds the AI SDK tool definitions from the registered tools.
 * Each tool gets a typed Zod schema so the LLM can call it correctly.
 */
function buildAITools() {
  return {
    list_directory: tool({
      description: ToolRegistry.resolve('list_directory').description,
      parameters: z.object({
        path: z.string().describe('Absolute or relative path to the directory to list'),
      }),
      execute: async (args) => {
        const result = await ToolRegistry.resolve('list_directory').execute(args);
        return formatToolResult(result);
      },
    }),

    current_directory: tool({
      description: ToolRegistry.resolve('current_directory').description,
      parameters: z.object({}),
      execute: async () => {
        const result = await ToolRegistry.resolve('current_directory').execute({});
        return formatToolResult(result);
      },
    }),

    read_file: tool({
      description: ToolRegistry.resolve('read_file').description,
      parameters: z.object({
        path: z.string().describe('Path to the file to read'),
      }),
      execute: async (args) => {
        const result = await ToolRegistry.resolve('read_file').execute(args);
        return formatToolResult(result);
      },
    }),

    create_file: tool({
      description: ToolRegistry.resolve('create_file').description,
      parameters: z.object({
        path: z.string().describe('Path where the file should be created'),
        content: z.string().describe('Text content to write into the file'),
        overwrite: z.boolean().optional().describe('Whether to overwrite if the file exists'),
      }),
      execute: async (args) => {
        const result = await ToolRegistry.resolve('create_file').execute(args);
        return formatToolResult(result);
      },
    }),

    create_directory: tool({
      description: ToolRegistry.resolve('create_directory').description,
      parameters: z.object({
        path: z.string().describe('Path of the directory to create'),
      }),
      execute: async (args) => {
        const result = await ToolRegistry.resolve('create_directory').execute(args);
        return formatToolResult(result);
      },
    }),

    move_file: tool({
      description: ToolRegistry.resolve('move_file').description,
      parameters: z.object({
        source: z.string().describe('Current path of the file or directory'),
        destination: z.string().describe('Target path to move to'),
      }),
      execute: async (args) => {
        const result = await ToolRegistry.resolve('move_file').execute(args);
        return formatToolResult(result);
      },
    }),

    rename_file: tool({
      description: ToolRegistry.resolve('rename_file').description,
      parameters: z.object({
        oldPath: z.string().describe('Current path of the file'),
        newPath: z.string().describe('New path (same directory, different name)'),
      }),
      execute: async (args) => {
        const result = await ToolRegistry.resolve('rename_file').execute(args);
        return formatToolResult(result);
      },
    }),

    delete_file: tool({
      description: ToolRegistry.resolve('delete_file').description,
      parameters: z.object({
        path: z.string().describe('Path to the file to delete'),
        confirmationToken: z
          .string()
          .optional()
          .describe('Confirmation token returned by a previous call to this tool'),
      }),
      execute: async (args) => {
        const result = await ToolRegistry.resolve('delete_file').execute(args);
        return formatToolResult(result);
      },
    }),
  };
}

function formatToolResult(result: ToolResult): unknown {
  if (result.requiresConfirmation) {
    return {
      requiresConfirmation: true,
      confirmationToken: result.confirmationToken,
      message:
        'This action requires user confirmation. Please ask the user to confirm before proceeding.',
    };
  }
  return result;
}

interface AgentStreamOptions {
  messages: Array<{ role: 'user' | 'assistant'; content: string }>;
}

export class AgentService {
  static stream(options: AgentStreamOptions) {
    return streamText({
      model: google(MODEL_ID),
      system: SYSTEM_PROMPT,
      messages: options.messages,
      tools: buildAITools(),
      maxSteps: 10,
    });
  }
}
