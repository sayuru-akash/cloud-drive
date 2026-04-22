# Cloud Drive

An internal file workspace for teams. Cloud Drive provides folder hierarchies, direct browser uploads to Backblaze B2, download-only share links, soft delete with retention, admin controls, and a full audit trail.

## Features

- **Workspace file management** — folder hierarchies with drag-and-drop upload, breadcrumbs, list/grid views, and sorting
- **Direct browser-to-storage uploads** — files go straight to Backblaze B2 via presigned URLs, never through your server
- **Multipart uploads** — automatic chunking for files over 500MB with resumable-like progress
- **Visibility controls** — per-file and per-folder `private` or `workspace` visibility
- **Shareable links** — time-limited public download links with expiry and optional email notification
- **Soft delete & retention** — deleted items are retained for a configurable window before admin hard-delete
- **Admin dashboard** — policy settings for upload limits, blocked extensions, retention days, and default share expiry
- **Audit logging** — every file/folder CRUD, share create/revoke, and permission change is logged
- **Password reset** — email-backed flow via Resend
- **Security headers** — HSTS, referrer policy, framing protection, and related hardening on all routes

## Tech Stack

| Layer | Technology |
|-------|------------|
| Framework | Next.js 16 (App Router, typed routes) |
| UI | React 19, Tailwind CSS v4, Lucide React |
| Auth | Better Auth v1.6.5 (session cookies, roles: `super_admin`, `admin`, `member`) |
| Database | Neon PostgreSQL + Drizzle ORM |
| Storage | Backblaze B2 (S3-compatible API) |
| Email | Resend |
| Testing | Vitest + jsdom + React Testing Library + Playwright |

## Architecture

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

### Upload Flow

1. Client calls `POST /api/files/initiate-upload` — creates `files` + `uploads` rows
2. Backend returns a presigned URL (single PUT) or a multipart upload ID
3. Client uploads bytes **directly to B2** via XMLHttpRequest (never through Vercel)
4. Client calls `POST /api/files/{id}/complete-upload` — finalizes DB state, inserts `fileVersions`, marks file as `ready`

### Download Flow

1. Client opens an app download route
2. The route validates auth or public share access
3. The app redirects to a short-lived signed Backblaze B2 download URL
4. Backblaze serves the file with attachment headers so the browser downloads it directly

### Key Directories

```
app/
  (workspace)/          # Protected routes (dashboard, files, settings, admin)
    files/              # File explorer with search, filters, bulk actions
    shared/             # Manage your share links
    deleted/            # Trash / restore
    settings/           # User settings
    admin/              # Admin dashboard
    audit/              # Full audit log
  api/                  # API routes (auth, file lifecycle, public share downloads)
    files/              # initiate-upload, complete-upload, cancel-upload, etc.
  login/                # Public login page
  forgot-password/      # Password reset request
  reset-password/       # Password reset confirmation
  privacy/              # Privacy policy
  s/[token]/            # Public share landing page
components/
  files/                # File explorer UI (toolbar, content, dialogs, selection)
  upload-queue.tsx      # Floating upload progress panel
  action-ui.tsx         # Global confirm dialogs and pending overlays
  route-loading-screen.tsx # Shared page-loading treatment
hooks/
  use-upload-queue.ts   # Upload lifecycle with XHR progress
lib/
  db/schema/            # Drizzle schema (auth, drive, audit, settings)
  auth.ts               # Better Auth setup
  drive.ts              # Folder/file queries and permission helpers
  storage.ts            # B2 S3 client (presigned URLs, multipart)
  env.ts                # Validated environment variables
  audit.ts              # Audit logging helpers
  app-settings.ts       # Feature flags and policy settings
drizzle/                # SQL migrations
public/                 # Static assets
e2e/                    # Playwright end-to-end tests
```

## Local Setup

### Prerequisites

- Node.js 22+
- A Neon PostgreSQL database
- A Backblaze B2 bucket (private, with CORS configured)
- (Optional) A Resend account for email features

### Installation

```bash
# 1. Install dependencies
npm install

# 2. Copy environment template
cp .env.example .env.local

# 3. Edit .env.local with your credentials
# See Environment Variables below for descriptions of each variable

# 4. Run database migrations
npx drizzle-kit migrate

# 5. Start the dev server
npm run dev
```

The app will be available at `http://localhost:3000`.

### Validate Locally

```bash
npm run test
npm run lint
npm run build
```

## Environment Variables

Copy `.env.example` to `.env.local` and fill in all required values.

### Required

| Variable | Description |
|----------|-------------|
| `DATABASE_URL` | PostgreSQL connection string. Example: `postgresql://user:pass@host/db?sslmode=require` |
| `BETTER_AUTH_SECRET` | Random secret for auth sessions. **Must be at least 32 characters.** |
| `B2_S3_ENDPOINT` | Backblaze B2 S3 endpoint. Example: `https://s3.us-west-001.backblazeb2.com` |
| `B2_KEY_ID` | B2 application key ID |
| `B2_APPLICATION_KEY` | B2 application key secret |
| `B2_BUCKET_NAME` | Private B2 bucket name (min 6 characters) |
| `APP_BASE_URL` | Canonical app origin. Example: `https://drive.yourcompany.com` |

### Optional

| Variable | Description | Default |
|----------|-------------|---------|
| `NEXT_PUBLIC_APP_URL` | Public app URL exposed to client. Falls back to `APP_BASE_URL` | — |
| `RESEND_API_KEY` | Resend API key for password reset and share notifications | — |
| `RESEND_FROM_EMAIL` | Verified sender address. Example: `Cloud Drive <noreply@email.yourcompany.com>` | — |
| `INTERNAL_EMAIL_DOMAIN` | Restrict signups to this email domain. Example: `yourcompany.com` | — |
| `MAX_UPLOAD_SIZE_BYTES` | Maximum upload size in bytes | `10737418240` (10 GB) |
| `DEFAULT_SOFT_DELETE_RETENTION_DAYS` | Days to retain soft-deleted files | `30` |
| `VERCEL_PROJECT_PRODUCTION_URL` | Provided by Vercel; used as `APP_BASE_URL` fallback | — |
| `VERCEL_URL` | Provided by Vercel; used as `APP_BASE_URL` fallback | — |

### Backblaze B2 Configuration

1. Create a **private** bucket.
2. Enable **SSE-B2** default encryption.
3. Generate an **Application Key** with access to that bucket.
4. Configure **CORS** on the bucket to allow browser uploads from your app origin:
   - Allowed Origins: `https://drive.yourcompany.com` (and `http://localhost:3000` for dev)
   - Allowed Operations: `s3:PutObject`, `s3:AbortMultipartUpload`, `s3:ListMultipartUploadParts`, `s3:ListBucketMultipartUploads`
   - Allowed Headers: `Content-Type`, `Origin`
   - Max Age Seconds: `3600`

## Database

### Schema

The Drizzle schema defines the following entities:

- **users / sessions** — Better Auth tables with role enum (`super_admin`, `admin`, `member`)
- **folders** — hierarchical folders with `parentId`, `visibility`, `isDeleted`
- **files** — file metadata with `status` (`pending` | `ready` | `failed` | `deleted`), `currentVersionId`
- **fileVersions** — immutable version records pointing to B2 storage keys
- **uploads** — upload session tracking with `uploadStatus` and `providerUploadId` for multipart
- **shareLinks** — public download tokens with expiry
- **auditLogs** — structured audit events with actor, action type, resource, and JSON metadata
- **appSettings** — key-value JSONB feature flags and policy overrides

### Migrations

```bash
# Apply existing migrations
npx drizzle-kit migrate

# Generate a new migration after schema changes
npx drizzle-kit generate
```

Never edit migration files after they have been applied. Always generate a new migration.

## Development

### Available Scripts

```bash
npm run dev          # Dev server (Turbopack)
npm run build        # Production build
npm start            # Start production server
npm run lint         # ESLint
npm run test         # Vitest run
npm run test:watch   # Vitest watch mode
npm run test:ui      # Vitest UI
npm run test:e2e     # Playwright run
npm run test:e2e:ui  # Playwright UI
```

### Type Checking

```bash
npx tsc --noEmit
```

### Code Conventions

- **Server Components by default**; interactivity extracted to Client Component islands
- **Server Actions** defined co-located in `app/(workspace)/files/actions.ts` and similar files
- **Path alias** `@/` used for all project imports
- **Lucide React** for all icons
- **Design system**: warm beige (`#f7f4ee`), emerald accent (`#197a68`), ink-scale neutrals, glassmorphism (`backdrop-blur`, `bg-white/80`, `rounded-[2rem]`)
- **Action UX**: use `components/action-ui.tsx` for blocking pending overlays and custom confirmations
- Typed routes enabled (`typedRoutes: true`); dynamic query strings use `// @ts-expect-error`

## Testing

### Unit & Component Tests

```bash
# Run all tests (CI mode)
npm run test

# Watch mode
npm run test:watch

# UI mode for debugging
npm run test:ui

# With coverage
npm run test -- --coverage
```

Stack: Vitest + jsdom + React Testing Library + MSW.

Test files live next to the code they test:
- `lib/*.test.ts` — utility and logic tests
- `hooks/*.test.ts` — hook tests
- `components/**/*.test.tsx` — component tests
- `app/api/**/*.test.ts` — API route tests

### E2E Tests

```bash
# Run E2E tests (starts dev server automatically)
npm run test:e2e

# E2E with UI debugger
npm run test:e2e:ui
```

Stack: Playwright (Chromium). Tests are in `e2e/`.

## Deployment

### Vercel (Recommended)

1. Push your repository to GitHub.
2. Import the project in Vercel.
3. Add all required environment variables in the Vercel dashboard.
4. Add the build command:
   - Build Command: `npm run build`
   - Output Directory: `.next`
5. Ensure `APP_BASE_URL` is set for the canonical production origin. `VERCEL_PROJECT_PRODUCTION_URL` and `VERCEL_URL` are fallback sources when `APP_BASE_URL` is not present.

### Production Notes

- Large uploads are browser-to-B2, so file bytes do not pass through Vercel functions.
- App download routes redirect to signed B2 URLs, so downloads do not stream through Vercel.
- Public shares are download-only. File preview routes are intentionally not part of the product.
- The app resolves auth and password-reset origins dynamically for Vercel and forwarded hosts, with `APP_BASE_URL` still preferred as the canonical origin.

### Health Check

The app exposes a readiness endpoint at `/api/health` that reports the status of:
- Database connectivity
- Auth configuration
- Storage configuration
- Email configuration

## Security

- **Secrets** managed via `.env` (never commit); validated in `lib/env.ts` with Zod
- **Auth secret** must be ≥ 32 characters
- **Upload limits** enforced at initiation (`MAX_UPLOAD_SIZE_BYTES`)
- **Blocked extensions** checked at upload initiation; configurable via admin settings
- **Share links** use cryptographically random tokens with optional expiry
- **Audit logging** covers all mutations for compliance and forensics
- **Security headers** applied globally via `next.config.ts`:
  - HSTS with preload
  - X-Frame-Options DENY
  - Referrer-Policy, X-Content-Type-Options, Permissions-Policy, COOP, CORP

## Roles & Permissions

| Role | Capabilities |
|------|-------------|
| `member` | Manage own files/folders, create shares, view workspace-visible resources |
| `admin` | Everything `member` can do, plus view all resources and access admin dashboard |
| `super_admin` | Everything `admin` can do, plus hard-delete and manage app settings |

Permission helpers (`canViewResource`, `canEditResource`, `canDeleteResource`, `canShareResource`) check ownership + role at every mutation boundary.

## Troubleshooting

### Uploads fail with CORS errors

Ensure your B2 bucket CORS allows your app origin. In development, add `http://localhost:3000`.

### Downloads return Backblaze XML errors

Check the filename being signed into `Content-Disposition`. The app now RFC 5987-encodes `filename*` in `lib/storage.ts`; if this regresses, filenames containing characters like parentheses can be rejected by B2.

### `db.select().from is not a function` in tests

API route tests mock `db` at the module level. When overriding `db.select` for a single test, use `mockImplementationOnce` rather than `mockImplementation` so the override does not leak to subsequent tests.

### Build fails with type errors on dynamic routes

Dynamic `router.push` with query strings requires `// @ts-expect-error Typed routes don't support dynamic query strings`.

## Current Validation

The current checked repo state has passed:

- `npm run test` for the unit/component test suite
- `npm run lint`
- `npm run build`
- `npx drizzle-kit migrate`

## License

MIT License. See [LICENSE](/Users/sayuru/Documents/GitHub/cloud-drive/LICENSE).
