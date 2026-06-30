# Contributing to AI Bash Assistant

## Code conventions

**TypeScript strict mode** — all types must be explicit. `any` is never allowed.

**No business logic in React components** — components render and delegate. All logic lives in `services/`, `tools/`, or `features/`.

**One responsibility per file** — a tool file only contains one tool. A service file only contains one service class.

**Errors are typed** — use the `AppError` hierarchy. Never `throw new Error('something')` in tool or service code.

## Tool pattern checklist

Every new tool must:

- [ ] Have a Zod input schema at the top of the file
- [ ] Call `InputSchema.safeParse(input)` and return `makeError(...)` on failure
- [ ] Call `PathValidator.validate()` for every path argument
- [ ] Return `makeSuccess(data, start)` or `makeError(message, start)` — never throw from `execute()`
- [ ] Handle `ENOENT`, `EACCES`, and generic errors with readable user messages
- [ ] Have a matching test in `tests/tools/`

## Naming conventions

| Thing | Convention | Example |
|-------|-----------|---------|
| Tool files | `camelCase.tool.ts` | `listDirectory.tool.ts` |
| Service files | `PascalCase.ts` | `PathValidator.ts` |
| Components | `PascalCase.tsx` | `ToolCallCard.tsx` |
| Hooks | `use` prefix | `useChatController.ts` |
| Types | `camelCase.types.ts` | `tool.types.ts` |
| Constants | `SCREAMING_SNAKE_CASE` | `COMMAND_WHITELIST` |

## PR checklist

- [ ] `npm run lint` passes
- [ ] `npm test` passes (all existing + new tests green)
- [ ] New tool has a description clear enough for the LLM to pick it correctly
- [ ] No `console.log` left in production code (only `console.error` in error paths)
- [ ] No hardcoded paths
- [ ] Security review: does the new code handle path inputs through `PathValidator`?

## Security rules (non-negotiable)

- Never call `exec`, `execSync`, `spawn`, or `spawnSync` directly — use the tool system
- Never bypass `PathValidator` — even in tests, mock it rather than passing raw paths
- Never add a command to `COMMAND_WHITELIST` without a documented justification
- Destructive operations (delete, overwrite) must set `requiresConfirmation: true` or use `ConfirmationService`

## Running tests

```bash
# All tests
npm test

# Watch mode
npm run test:watch

# Specific file
npx vitest run tests/security/security.test.ts
```

## Extending the tool ecosystem

**Git tools** — create `tools/definitions/git/` with `gitStatus.tool.ts`, `gitLog.tool.ts`, etc. Add a `registerGitTools()` function and call it from `registerAllTools()`.

**Docker tools** — same pattern under `tools/definitions/docker/`.

**npm tools** — `npmList.tool.ts`, `npmInstall.tool.ts` (with heavy confirmation flow for install).

Each tool category should have its own subdirectory and its own registration function to keep `registerTools.ts` clean.
