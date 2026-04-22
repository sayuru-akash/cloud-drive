<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# Project Overview

Cloud Drive is a workspace file-management platform built with Next.js 16 and React 19. It provides Google Drive-like functionality for teams: folder hierarchies, file uploads (including multipart for large files), visibility controls, shareable links, soft-delete with retention, admin dashboards, and audit logging. Files are stored on Backblaze B2 via presigned URLs; metadata lives in Neon PostgreSQL.

## Repository Structure

- `app/` — Next.js App Router
  - `(workspace)/` — Protected routes (dashboard, files, settings, admin, etc.)
  - `api/` — API routes (auth, file upload lifecycle, public share downloads)
  - `login/`, `forgot-password/`, `reset-password/`, `privacy/` — Public pages
- `components/` — React components
  - `files/` — File-explorer UI (toolbar, content grid/list, dialogs, selection hooks)
  - `upload-queue.tsx`, `upload-trigger.tsx` — Floating upload progress & trigger
- `hooks/` — Client hooks (`use-upload-queue.ts`)
- `lib/` — Core business logic
  - `db/schema/` — Drizzle ORM schema (auth, drive, audit, settings)
  - `auth/`, `auth.ts` — Better Auth setup and session helpers
  - `drive.ts` — Folder/file queries and permission checks
  - `storage.ts` — Backblaze B2 S3 client (single + multipart upload support)
  - `env.ts` — Validated environment variables with Zod
  - `audit.ts` — Audit logging helpers
- `drizzle/` — SQL migrations managed by Drizzle Kit
- `public/` — Static assets

## Build & Development Commands

```bash
# Install dependencies
npm install

# Run dev server (Turbopack)
npm run dev

# Production build
npm run build

# Type check
npx tsc --noEmit

# Lint
npm run lint
# or
npx eslint <path>

# Start production server
npm start

# Apply database migrations
npx drizzle-kit migrate
```

## Code Style & Conventions

- **Language**: TypeScript 5, strict mode enabled
- **Framework**: Next.js 16 App Router with **typed routes** (`typedRoutes: true` in `next.config.ts`)
- **Styling**: Tailwind CSS v4 with CSS-based `@theme inline` config
- **Design system**: Warm beige background (`#f7f4ee`), emerald accent (`#197a68`), ink-scale neutrals, glassmorphism (`backdrop-blur`, `bg-white/80`, `rounded-[2rem]`)
- **Components**: Server Components by default; interactivity extracted to Client Component islands
- **Icons**: Lucide React only
- **Imports**: Use `@/` path alias (e.g., `@/lib/drive`, `@/components/files/files-shell`)
- **Server Actions**: Defined in `app/(workspace)/files/actions.ts` and similar co-located files; use `FormData` input; call `revalidateWorkspace()` after mutations
- **Forms**: Use React 19 `useActionState`, `useTransition`, `useOptimistic`
- **Confirmation dialogs**: Use `@/components/action-ui` (`useActionConfirm` + `ActionUiProvider`)
- **Dynamic href navigation**: `router.push` with query strings requires `// @ts-expect-error Typed routes don't support dynamic query strings`

## Architecture Notes

```
┌─────────────┐     ┌──────────────┐     ┌─────────────────┐
│   Client    │────▶│  Next.js API │────▶│   Neon Postgres │
│  (Browser)  │     │   (App Router)│     │   (Drizzle ORM) │
└──────┬──────┘     └──────┬───────┘     └─────────────────┘
       │                   │
       │ presigned URL     │ B2 S3 SDK
       ▼                   ▼
┌─────────────┐     ┌──────────────┐
│ Backblaze   │◀────│  lib/storage │
│     B2      │     │   (S3Client) │
└─────────────┘     └──────────────┘
```

- **Auth**: Better Auth v1.6.5 with session cookies; roles are `super_admin`, `admin`, `member`
- **File upload flow**:
  1. Client calls `POST /api/files/initiate-upload` → creates `files` + `uploads` rows
  2. Backend returns presigned URL (single PUT) or multipart upload ID
  3. Client uploads bytes **directly to B2** (never through Vercel)
  4. Client calls `POST /api/files/{id}/complete-upload` → finalizes DB state
- **Permissions**: `canEditResource`, `canDeleteResource`, `canShareResource` helpers check ownership + role
- **Soft delete**: Files/folders marked `isDeleted` with retention window; admins can hard-delete

## Testing Strategy

> No test suite is currently configured. The `.playwright-cli/` directory contains only runtime logs from an external CLI tool, not actual Playwright tests. There are no `.spec.ts`, `.test.ts`, or `.test.tsx` files in the project source.

### Verification Steps Performed Manually

After non-trivial changes, run the following checks before considering the task complete:

1. `npx tsc --noEmit` — TypeScript strict-mode type check
2. `npm run build` — Production build with Turbopack
3. `npm run lint` — ESLint across the entire project
4. `npx eslint <path>` — Targeted lint on newly created or edited files

### Recommended Test Coverage (Not Yet Implemented)

- **Unit tests** (Vitest): `lib/storage.ts` (B2 disposition sanitization, multipart math), `lib/drive.ts` (permission helpers), `lib/env.ts` (Zod schema validation)
- **Component tests** (Vitest + React Testing Library): `FilesContent` selection logic, `useUploadQueue` state transitions, `NewFolderDialog` form validation
- **E2E tests** (Playwright): file upload flow (single + multipart), folder creation, share link generation, drag-and-drop, refresh during upload, soft-delete recovery
- **CI workflow** (GitHub Actions): run typecheck, lint, build, and `npm audit` on every PR

## Security & Compliance

- **Secrets**: Managed via `.env` (never commit); validated in `lib/env.ts` with Zod
- **Auth secret**: `BETTER_AUTH_SECRET` must be ≥ 32 characters
- **Upload limits**: `MAX_UPLOAD_SIZE_BYTES` (default 10 GB); blocked extensions checked in `initiate-upload`
- **Share links**: Token-based with expiry (default 7 days), optional password, optional email notification
- **Audit logging**: All file/folder CRUD, share create/revoke, and permission changes are logged
- **Dependency scanning**: Run `npm audit` regularly; add to CI when a GitHub Actions workflow is created

## Agent Guardrails

- **Never** modify `drizzle/` migration files after they have been applied; create new migrations instead
- **Never** touch `.env` or committed credential files
- **Always** run `npx tsc --noEmit` and `npx next build` after non-trivial changes
- **Always** run `npx eslint` on new or edited files
- **Review required** for: auth logic, permission checks, database schema changes, storage key logic
- **Do not** add new environment variables without updating `.env.example` and `lib/env.ts`
- **Do not** use `any`; strict TypeScript is enforced
- **Preserve** the design system: warm beige, emerald accent, glassmorphism, rounded-[2rem], no gradients/shadows

## Extensibility Hooks

- **Feature flags**: `lib/app-settings.ts` reads from `app_settings` table (key-value JSONB)
- **Blocked file types**: Controlled via `app_settings.blockedFileExtensions`
- **Retention days**: `DEFAULT_SOFT_DELETE_RETENTION_DAYS` env var + `app_settings` override
- **Email domain restrictions**: `INTERNAL_EMAIL_DOMAIN` env var
- **Storage provider**: Abstracted in `lib/storage.ts`; swapping B2 for S3-compatible provider requires only endpoint/credential changes

## Further Reading

- `README.md` — Setup instructions and feature overview
- `CLAUDE.md` — `@AGENTS.md` reference
- `drizzle.config.ts` — Database migration configuration
- `next.config.ts` — Next.js configuration (typed routes, security headers)
- `lib/env.ts` — Full environment variable schema and defaults
