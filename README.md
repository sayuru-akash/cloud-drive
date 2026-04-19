# Cloud Drive

A production-grade Next.js 16 foundation for an internal file workspace. This starter is aligned to the product spec in [`cloud-drive-spec.md`](/Users/sayuru/Documents/GitHub/cloud-drive/cloud-drive-spec.md) and is intentionally scoped to the app shell, production defaults, and integration-ready structure.

## Included

- polished marketing landing page and internal workspace routes
- Next.js metadata, manifest, robots, sitemap, and dynamic OG image
- hardened `next.config.ts` response headers and typed routes
- server-only env parsing with a health/readiness endpoint
- custom `not-found` and global error boundaries
- `.env.example` committed safely while real `.env*` files remain ignored

## Routes

- `/`
- `/dashboard`
- `/files`
- `/shared`
- `/deleted`
- `/settings`
- `/admin`
- `/login`
- `/api/health`

## Local setup

1. Install dependencies: `npm install`
2. Copy `.env.example` to `.env.local`
3. Run the dev server: `npm run dev`
4. Validate production build: `npm run lint && npm run build`

## Planned integration phases

1. Better Auth and protected route enforcement
2. Neon + Drizzle schema and resource permission model
3. Backblaze B2 signed upload and download flows
4. Share-link lifecycle, delete/restore, and audit persistence
5. Resend and Sentry wiring
