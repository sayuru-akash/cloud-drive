# Cloud Drive

An internal file workspace built on Next.js 16, Better Auth, Drizzle, Neon, Backblaze B2, and Resend. Designed for secure file management and sharing within an organization, with features like direct browser uploads, shareable links, and admin controls.

## Included

- protected App Router workspace with Better Auth session enforcement
- Neon + Drizzle schema for files, folders, uploads, share links, audit logs, and settings
- direct browser-to-B2 uploads with progress, duplicate-name handling, cancel, and retry
- file and folder rename, move, visibility controls, soft delete, restore, and admin hard delete
- public share links with expiry, revoke, view-only preview proxying, and download mode
- email-backed password reset and optional share-link notification through Resend
- admin policy settings for upload limit, blocked file extensions, retention, and default share expiry
- sitemap, robots, manifest, OG image, error boundaries, and health/readiness endpoint

## Routes

- `/`
- `/login`
- `/forgot-password`
- `/reset-password`
- `/dashboard`
- `/files`
- `/shared`
- `/deleted`
- `/settings`
- `/admin`
- `/s/[token]`
- `/api/health`

## Local setup

1. Install dependencies: `npm install`
2. Copy `.env.example` to `.env.local`
3. Run migrations: `npx drizzle-kit migrate`
4. Run the dev server: `npm run dev`
5. Validate production build: `npm run lint && npm run build`

## Required env

- `DATABASE_URL`
- `BETTER_AUTH_SECRET`
- `B2_S3_ENDPOINT`
- `B2_KEY_ID`
- `B2_APPLICATION_KEY`
- `B2_BUCKET_NAME`
- `NEXT_PUBLIC_APP_URL`
- `APP_BASE_URL`

## Email env

- `RESEND_API_KEY`
- `RESEND_FROM_EMAIL`
- `INTERNAL_EMAIL_DOMAIN`

## Backblaze notes

- Keep the B2 bucket private.
- Enable SSE-B2 default encryption.
- Configure bucket CORS to allow your app origin against the B2 S3 endpoint for browser-direct uploads.
