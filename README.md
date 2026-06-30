# AI Bash Assistant

A production-quality web application that lets you manage your file system through natural language. Describe what you want to do in French or English, and the AI selects the right tool to execute it — safely, without ever giving the model direct shell access.

## Architecture overview

```
User input
    ↓
Next.js App Router (React, Tailwind CSS)
    ↓
POST /api/chat (Route Handler)
    ↓
AgentService → AI SDK streamText()
    ↓
Tool Calling (Zod-typed tool definitions)
    ↓
Security Layer (PathValidator · CommandGuard · InputSanitizer)
    ↓
FileSystem Tools (list · read · write · move · delete)
    ↓
Node.js fs/promises
    ↓
Streamed response back to UI
```

**Five architecture layers, zero business logic in React components.**

## Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 15 App Router, React 19, TypeScript strict |
| Styling | Tailwind CSS |
| AI | Vercel AI SDK, Google Gemini (`@ai-sdk/google`) |
| Validation | Zod |
| File ops | Node.js `fs/promises` |
| Security | Custom `PathValidator`, `CommandGuard`, `InputSanitizer`, `ConfirmationService` |
| Testing | Vitest |

## Quick start

### 1. Install dependencies

```bash
npm install
```

### 2. Configure environment

```bash
cp .env.local.example .env.local
```

Edit `.env.local` and add your Google Generative AI (Gemini) API key:

```
GOOGLE_GENERATIVE_AI_API_KEY=AIza...
```

Get a free key at [aistudio.google.com/apikey](https://aistudio.google.com/apikey) — no credit card required for development usage.

### 3. Run in development

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### 4. Run tests

```bash
npm test
```

## Available tools

| Tool | Description |
|------|-------------|
| `list_directory` | List files and folders in a path |
| `current_directory` | Return the current working directory |
| `read_file` | Read the content of a text file (max 5 MB) |
| `create_file` | Create a new file with given content |
| `create_directory` | Create a directory (recursive) |
| `move_file` | Move a file or directory |
| `rename_file` | Rename a file within the same directory |
| `delete_file` | Delete a file — **requires confirmation** |

## Security model

- The LLM **never executes shell commands directly**.
- Every operation goes through a typed tool with Zod validation.
- `PathValidator` resolves all paths with `path.resolve()` and rejects anything outside `$HOME` and `/tmp`.
- `CommandGuard` maintains a strict whitelist: `ls pwd cat mkdir touch mv cp`. Everything else is blocked.
- `InputSanitizer` rejects shell injection patterns (`;`, `|`, `` ` ``, `$()`, etc.) before any operation.
- `delete_file` uses a one-time HMAC-signed token that expires after 60 seconds.

## Project structure

```
app/                    Next.js App Router pages and API routes
components/
  chat/                 ChatContainer, MessageList, MessageBubble, InputBar
  tools/                ToolCallCard, ToolResultCard, StatusIndicator, ConfirmationModal
  ui/                   Avatar, Spinner, ErrorBanner
features/chat/          useChatController (state orchestration)
services/
  agent/                AgentService (AI SDK), systemPrompt
  security/             PathValidator, CommandGuard, InputSanitizer, ConfirmationService
  filesystem/           FileSystemService (fs abstraction)
tools/
  definitions/          One file per tool (8 total)
  BaseTool.ts           Shared interface + result helpers
  ToolRegistry.ts       Registry pattern — single source of truth
  registerTools.ts      Registers all tools at startup
types/                  message.types, tool.types, error.types
lib/
  constants.ts          Whitelists, blacklists, limits
  errors/               AppError hierarchy
hooks/                  useAutoScroll, useCopyToClipboard
utils/                  formatBytes, formatDate
tests/
  tools/                tools.test.ts, registry.test.ts
  security/             security.test.ts, confirmation.test.ts
```

## Adding a new tool

1. Create `tools/definitions/myTool.tool.ts`:

```ts
import { z } from 'zod';
import type { BaseTool } from '../BaseTool';
import { makeSuccess, makeError } from '../BaseTool';
import { PathValidator } from '@/services/security/PathValidator';

const InputSchema = z.object({ path: z.string().min(1) });
type Input = z.infer<typeof InputSchema>;

export const myTool: BaseTool<Input, { result: string }> = {
  name: 'my_tool',
  description: 'Description shown to the LLM to guide tool selection.',
  async execute(input) {
    const start = Date.now();
    try {
      const parsed = InputSchema.safeParse(input);
      if (!parsed.success) return makeError(parsed.error.errors[0]?.message ?? 'Invalid input', start);
      const validPath = PathValidator.validate(parsed.data.path);
      // ... your logic here
      return makeSuccess({ result: 'done' }, start);
    } catch (err) {
      return makeError('Something went wrong.', start);
    }
  },
};
```

2. Register it in `tools/registerTools.ts`:

```ts
import { myTool } from './definitions/myTool.tool';
ToolRegistry.register(myTool);
```

3. Add it to `AgentService.ts` under `buildAITools()` with a Zod schema.

4. Add a test in `tests/tools/`.

That's it. No other files need to change.

## Roadmap

- [ ] Git tools (`git status`, `git log`, `git diff`)
- [ ] npm / pnpm tools
- [ ] Docker tools
- [ ] Conversation memory
- [ ] Multi-step plan preview before execution
- [ ] Permission configuration per session
- [ ] Dark/light theme toggle
- [ ] Terminal history panel
