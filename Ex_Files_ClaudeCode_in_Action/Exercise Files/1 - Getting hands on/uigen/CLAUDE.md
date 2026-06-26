# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Code Style

- Use comments sparingly. Only comment complex code.

## Commands

```bash
npm run setup          # First-time setup: install deps + prisma generate + migrate
npm run dev            # Start dev server at http://localhost:3000 (uses Turbopack)
npm run build          # Production build
npm run lint           # ESLint
npm test               # Run all Vitest tests
npx vitest run src/lib/__tests__/file-system.test.ts   # Run a single test file
npm run db:reset       # Wipe and re-run all migrations (destructive)
```

On networks with SSL inspection (corporate VPN, proxies), prefix commands with `NODE_TLS_REJECT_UNAUTHORIZED=0` to work around certificate errors from Prisma binary downloads.

## Environment

Copy `.env` and set:
```
ANTHROPIC_API_KEY=your-key   # Optional — app runs with a static mock if omitted
JWT_SECRET=your-secret        # Falls back to "development-secret-key"
```

Without an API key, `src/lib/provider.ts` returns a `MockLanguageModel` that generates hardcoded Counter/Card/Form components so the full UI flow still works.

## Architecture

**Next.js App Router** — all routes under `src/app/`. The single API endpoint is `src/app/api/chat/route.ts`.

### Request/response flow

1. User types a prompt in the chat UI → `POST /api/chat` with `{ messages, files, projectId? }`
2. The route reconstructs a `VirtualFileSystem` from the serialized `files` payload, then calls `streamText` (Vercel AI SDK) with two tools: `str_replace_editor` and `file_manager`
3. Claude streams tool calls back. `onFinish` persists the updated messages and file data to the `Project` row in SQLite (only for authenticated users with a `projectId`)
4. The client-side `FileSystemContext` (`src/lib/contexts/file-system-context.tsx`) intercepts tool call events and applies mutations to its in-memory `VirtualFileSystem` instance, triggering React re-renders

### Virtual file system

`src/lib/file-system.ts` — an in-memory tree (`Map<string, FileNode>`) that lives entirely client-side and is serialized as JSON into the `Project.data` column. Nothing is written to disk. Every project starts empty; the AI must create `/App.jsx` as the entrypoint.

The preview panel renders `/App.jsx` live using `@babel/standalone` to transpile JSX in the browser. Imports using the `@/` alias resolve against other files in the virtual FS.

### Auth

JWT-based, cookie-only. `src/lib/auth.ts` signs/verifies tokens with `jose`. `src/middleware.ts` guards `/api/projects` and `/api/filesystem`. Anonymous users can use the full chat/preview UI; their work is stored in `sessionStorage` via `src/lib/anon-work-tracker.ts` and can be claimed on sign-up.

### Data model (Prisma/SQLite)

The schema is defined in `prisma/schema.prisma` — reference it whenever you need to understand the database structure.

- `User` — email + bcrypt password
- `Project` — belongs to an optional `User`. `messages` (JSON array) and `data` (JSON object, the serialized VFS) are stored as plain `String` columns and parsed at runtime.

### AI tools given to Claude

- `str_replace_editor` (`src/lib/tools/str-replace.ts`) — `create`, `str_replace`, `view`, `insert` commands operating on the VFS
- `file_manager` (`src/lib/tools/file-manager.ts`) — `rename`, `delete` commands

### System prompt constraints (enforced in `route.ts`)

- Every project must have `/App.jsx` as default export entrypoint
- Style with Tailwind, not inline styles
- No HTML files
- Import non-library files with `@/` alias

### Key contexts

| Context | File | Purpose |
|---------|------|---------|
| `FileSystemContext` | `src/lib/contexts/file-system-context.tsx` | Owns the VFS instance; applies AI tool calls |
| `ChatContext` | `src/lib/contexts/chat-context.tsx` | Manages message history and streaming state |

### Tests

Vitest + jsdom + React Testing Library. Test files live next to their subjects in `__tests__/` subdirectories. The VFS (`src/lib/__tests__/file-system.test.ts`) and both contexts have unit/integration tests.
