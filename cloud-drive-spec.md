# Cloud Drive Web App Specification

## 1. Document Purpose

This document defines the full product, technical, security, and delivery specification for a company-internal Google Drive alternative built as a web application.

The goal is to provide a secure, modern, low-cost file management system for internal company use, with support for:
- file upload and download
- folder organisation
- private and shared access
- public view links when needed
- admin control
- auditability
- safe handling of files stored in Backblaze B2

This specification is written to be implementation-ready so it can be handed to engineering agents or developers as the main source of truth.

---

## 2. Product Summary

### 2.1 Product Goal
Build a secure file storage and sharing web app for company use that behaves like a lightweight Google Drive for internal operations, but with simpler scope, lower cost, and tighter control.

### 2.2 Core Objectives
- Centralise company file storage
- Allow authenticated users to upload, manage, and retrieve files
- Support folder hierarchy and clean file organisation
- Support safe sharing with controlled permissions
- Support public view links when needed
- Keep infrastructure cost-efficient
- Maintain strong security and audit controls

### 2.3 Non-Goals for Version 1
The following are out of scope unless explicitly added later:
- real-time collaborative document editing
- desktop sync client
- mobile app
- in-browser Office or Google Docs style editing
- comments and annotation system
- complex enterprise DLP systems
- OCR-heavy document intelligence
- advanced external user accounts

---

## 3. Recommended Tech Stack

## 3.1 Final Stack
- Frontend and backend app: **Next.js**
- Language: **TypeScript**
- Styling: **Tailwind CSS**
- Database: **Neon PostgreSQL**
- ORM: **Drizzle ORM**
- Authentication: **Better Auth**
- Object storage: **Backblaze B2** using **S3-compatible API**
- Email delivery: **Resend**
- File/image preview processing: app-side or worker-side as needed
- Background jobs: lightweight in-app jobs initially, expandable later
- Error monitoring: **Sentry**
- Analytics: optional, can be added later
- Hosting: **Vercel** for the app

## 3.2 Why This Stack
### Next.js
Chosen because it supports the full web app experience in one codebase, including:
- authenticated dashboards
- file browser pages
- admin pages
- API routes / route handlers
- server-side permission checks
- clean deployment on Vercel

### Neon PostgreSQL
Chosen because it gives:
- managed Postgres
- low operational overhead
- good developer experience
- clean fit for relational metadata
- scalability without managing a database server

### Drizzle ORM
Chosen because it is light, TypeScript-native, explicit, and well-suited for an application where schema control matters.

### Better Auth
Chosen because it gives modern auth flows with flexibility, and is suitable for:
- email/password login
- magic links
- admin-friendly security extension later
- passkey support later if needed

### Backblaze B2
Chosen because it provides:
- low-cost object storage
- S3-compatible integration
- simple browser-direct upload patterns
- good fit for storing binary file data

## 3.3 Why Redis Is Not Included
Redis is intentionally excluded from version 1 to keep costs and complexity lower.

It is not required to deliver the core application safely and correctly.

Any temporary state that would normally be pushed to Redis should instead be handled using:
- PostgreSQL tables for upload sessions and tokens
- signed URLs with short expiry
- database-backed rate limiting for admin-critical endpoints if needed
- Vercel edge or middleware checks where suitable

If scale later requires it, Redis can be added as a phase 2 optimisation, not as a dependency from day one.

---

## 4. High-Level Architecture

## 4.1 Architecture Overview
The system will follow a clear separation of responsibilities:

### App Layer
The Next.js application will handle:
- UI rendering
- user sessions
- permission checks
- metadata CRUD
- share link logic
- audit events
- generation of signed upload and download URLs

### Database Layer
Neon PostgreSQL will store:
- users
- roles
- folders
- file records
- file versions
- share links
- access policies
- audit logs
- upload sessions
- delete requests

### Storage Layer
Backblaze B2 will store the actual file contents only.

B2 must not be treated as the system of record for permissions or business logic.

### Email Layer
Resend will handle:
- invite emails if added later
- magic links if enabled
- share notifications if enabled later
- password reset flows

---

## 5. Product Scope

## 5.1 User Types
### Super Admin
Full access across the system. Can:
- view all files
- access admin dashboard
- manage users and roles
- override permissions
- review audit logs
- manage share policies
- restore deleted content if within retention

### Internal User
Authenticated company user. Can:
- view allowed folders/files
- upload files where permitted
- create folders where permitted
- download files where permitted
- create share links if permitted
- rename or move files/folders where permitted

### Public Visitor
Unauthenticated person with a valid shared link. Can only:
- view or download according to link rules
- access only the specific shared resource allowed by the signed share link

## 5.2 Main Functional Areas
- authentication
- file browser
- folders
- upload system
- download system
- sharing system
- access control
- admin controls
- audit logging
- lifecycle handling
- search and filtering

---

## 6. Functional Requirements

## 6.1 Authentication and Session Management
### Required Features
- secure login page
- email and password authentication
- password reset flow
- session expiration management
- secure logout
- route protection for authenticated pages
- route protection for admin-only pages

### Optional for Near-Term Expansion
- magic link login
- passkeys for admins
- enforced multi-factor authentication for admins

### Session Rules
- sessions must be stored securely
- cookies must be httpOnly and secure in production
- session invalidation must occur on logout
- suspicious repeated failed logins must be logged

---

## 6.2 Dashboard and File Browser
### Required Features
- home dashboard after login
- file listing view
- folder navigation view
- breadcrumbs
- file/folder search
- filter by type
- sort by name, date, size
- recent files section
- shared by me section
- shared with me section if internal sharing is implemented

### Display Fields
For each file row or card:
- file name
- type / extension
- owner
- modified date
- size
- visibility badge
- actions menu

### Display Fields for Folders
- folder name
- owner
- modified date
- visibility badge if shared
- actions menu

---

## 6.3 Folder Management
### Required Features
- create folder
- rename folder
- move folder
- soft delete folder
- restore folder if in deleted state
- nested folders

### Folder Rules
- system must support parent-child hierarchy
- prevent moving a folder into itself or its descendant
- deleting a folder should mark all descendant items as deleted logically, not immediately hard delete all storage assets

---

## 6.4 File Upload
### Required Features
- upload one or multiple files
- drag and drop upload
- upload progress indicator
- support large files
- direct browser-to-B2 upload using signed URLs
- upload cancellation
- upload retry if not completed
- file metadata registration before upload finalisation

### Upload Process
1. user selects target folder
2. app creates upload session record in database
3. app creates pending file record in database
4. app generates signed upload URL or multipart session
5. browser uploads file directly to B2
6. app verifies upload completion
7. app marks file as ready
8. audit log is created

### Upload Validation
- max file size rule must be configurable
- blocked file types list must be configurable
- MIME type and extension must be validated
- zero-byte uploads must be rejected unless explicitly allowed
- duplicate names in same folder must follow a defined policy

### Duplicate Name Policy
Recommended:
- allow duplicate names if desired, but show a warning
- alternatively auto-append suffix like `(1)` when configured

System should make this a configurable product rule.

---

## 6.5 File Download
### Required Features
- authenticated download
- shared-link download when permitted
- short-lived signed download URLs
- audit log for download event

### Download Rules
- every private file download must first pass permission checks in app layer
- app must never expose permanent raw storage URLs for private resources
- download URLs should be short-lived

---

## 6.6 File Viewing and Preview
### Required Features
- browser preview for supported file types where feasible
- image preview
- PDF preview
- video/audio preview if supported later
- fallback to download if preview is unsupported

### Preview Strategy
Version 1 recommendation:
- support preview for images and PDFs first
- use signed preview access
- do not attempt advanced preview generation for all file types initially

---

## 6.7 Sharing and Access Control
### Required Sharing Modes
1. **Private**
   - only explicitly permitted internal users

2. **Workspace/Internal**
   - accessible to all authenticated users in the company workspace if enabled

3. **Anyone with link can view**
   - unauthenticated link access
   - read-only

4. **Anyone with link can download**
   - unauthenticated link access
   - download enabled

5. **Link with expiry**
   - public link becomes invalid after configured date/time

6. **Link with password**
   - optional password protection for external sharing

### Required Share Controls
- create link
- revoke link
- copy share link
- set expiry date
- toggle view-only vs download-enabled
- optional password set
- optional internal-only restriction

### Share Rules
- only authorised users may create share links
- admins can revoke any share link
- share links must map to a specific file or folder record
- access must fail if resource is deleted, revoked, or expired

---

## 6.8 Permission Model
### Recommended Model for Version 1
Use role-based access control combined with resource-level grants.

### Baseline Roles
- super_admin
- admin
- member

### Resource Permissions
Per file or folder, support:
- can_view
- can_download
- can_upload
- can_edit_metadata
- can_delete
- can_share
- can_manage_permissions

### Recommended Simplification for Version 1
Instead of building a very complex ACL editor immediately:
- use ownership
- use workspace-level access toggle
- use explicit internal shares when needed
- use public share links when needed

This keeps v1 manageable while still flexible.

---

## 6.9 Search
### Required Features
- search by file name
- search by folder name
- filter by file type
- filter by owner
- filter by date range

### Version 1 Search Scope
Search only structured metadata, not full document content.

That means:
- no OCR search
- no document text indexing
- no semantic search

These can be phase 2 items.

---

## 6.10 Deletion and Recovery
### Required Features
- soft delete files
- soft delete folders
- deleted items view
- restore deleted items within retention period
- hard delete after retention or manual admin action

### Deletion Rules
- deleting a file should not instantly remove the physical object unless policy says so
- deleted resources should become inaccessible to normal users immediately
- share links must stop working for deleted resources
- admin can restore if still within retention

### Retention Recommendation
- default soft delete retention: 30 days

---

## 6.11 Audit Logging
### Required Events
- login success
- login failure
- logout
- file upload created
- file upload completed
- file downloaded
- file previewed
- file renamed
- file moved
- file deleted
- file restored
- folder created
- folder renamed
- folder moved
- folder deleted
- share link created
- share link revoked
- permission changed
- admin override access

### Audit Log Fields
- actor user id
- actor email
- action type
- target resource type
- target resource id
- timestamp
- IP address where available
- user agent where useful
- metadata JSON payload

---

## 6.12 Admin Features
### Required Admin Features
- user list
- role management
- resource visibility overview
- deleted items management
- audit log viewing
- share link management
- blocked file type settings
- max file size settings
- retention settings

### Optional Admin Features Later
- suspicious activity alerts
- share link usage analytics
- storage usage dashboards
- per-user quotas

---

## 7. Security Specification

## 7.1 Core Security Principles
- deny by default
- all protected resources require server-side authorisation checks
- object storage is not trusted as an access-control engine
- all file actions are auditable
- signed links must be short-lived and purpose-specific

## 7.2 Authentication Security
- secure password hashing
- brute-force mitigation
- session expiration and revocation
- secure cookie settings
- password reset token expiration

## 7.3 Storage Security
- B2 bucket should not be openly exposed for private content
- private files must only be accessed via signed URLs after permission checks
- storage object key structure should avoid guessable public patterns where possible
- server-side encryption should be enabled

## 7.4 Application Security
- validate all input
- protect against CSRF where applicable
- use server-side validation, not only client-side validation
- escape output where necessary
- restrict admin routes
- use parameterised database queries through ORM

## 7.5 File Security
- validate content type and extension
- maintain denylist for dangerous executable types if needed
- optionally scan files before marking them active if antivirus is added later
- support max file size limits

## 7.6 Share Link Security
- long random tokens
- expiry enforcement
- optional password hashing for protected share links
- revoked links must be invalid immediately
- access attempt logging for public links is recommended

## 7.7 Audit and Forensics
- critical actions must be logged immutably enough for internal review
- admin override access must be especially logged
- deletion and restoration must be traceable

---

## 8. Data Model Specification

## 8.1 Core Tables

### users
Stores internal user accounts.

Suggested fields:
- id
- email
- full_name
- password_hash or external auth reference
- role
- is_active
- created_at
- updated_at
- last_login_at

### sessions
Stores active or historical sessions depending on auth library pattern.

Suggested fields:
- id
- user_id
- session_token_hash
- expires_at
- created_at
- last_seen_at

### folders
Stores logical folder structure.

Suggested fields:
- id
- org_id or workspace_id
- parent_folder_id nullable
- name
- owner_user_id
- created_by_user_id
- is_deleted
- deleted_at nullable
- created_at
- updated_at

### files
Stores logical file records.

Suggested fields:
- id
- org_id or workspace_id
- folder_id nullable
- owner_user_id
- created_by_user_id
- current_version_id nullable
- original_name
- display_name
- extension
- mime_type
- size_bytes
- checksum nullable
- status enum pending|ready|failed|deleted
- visibility enum private|workspace
- is_deleted
- deleted_at nullable
- created_at
- updated_at

### file_versions
Stores immutable file versions if versioning is enabled.

Suggested fields:
- id
- file_id
- version_number
- storage_bucket
- storage_key
- size_bytes
- mime_type
- checksum nullable
- uploaded_by_user_id
- created_at

### resource_permissions
Stores explicit internal grants for files or folders.

Suggested fields:
- id
- resource_type enum file|folder
- resource_id
- subject_type enum user|role
- subject_id or role value
- can_view
- can_download
- can_upload
- can_edit_metadata
- can_delete
- can_share
- can_manage_permissions
- created_at
- updated_at

### share_links
Stores public or external share links.

Suggested fields:
- id
- resource_type enum file|folder
- resource_id
- token_hash
- created_by_user_id
- mode enum view|download
- password_hash nullable
- expires_at nullable
- is_revoked
- created_at
- updated_at

### uploads
Tracks upload sessions.

Suggested fields:
- id
- file_id
- initiated_by_user_id
- upload_status enum initiated|uploading|completed|failed|cancelled
- multipart_upload_id nullable
- expires_at nullable
- created_at
- updated_at

### audit_logs
Stores audit events.

Suggested fields:
- id
- actor_user_id nullable
- actor_email nullable
- action_type
- resource_type nullable
- resource_id nullable
- ip_address nullable
- user_agent nullable
- metadata_json
- created_at

### deleted_items or rely on status fields
Depending on implementation preference, deleted state can be modelled through status columns on folders/files and restored from there.

## 8.2 Recommended Constraints
- foreign keys for integrity
- indexes on folder_id, owner_user_id, created_at, updated_at
- unique constraints where appropriate
- index on file display_name for search
- index on share link validity fields

## 8.3 Notes on Folder Tree Modelling
Recommended for version 1:
- adjacency list model using `parent_folder_id`

It is simpler to implement and sufficient unless folder trees become extremely large or complex.

---

## 9. Storage Key Design

## 9.1 Object Key Convention
Recommended B2 object key format:

`workspace/{workspaceId}/files/{fileId}/versions/{versionNumber}/{safeFilename}`

Alternative shorter format:

`w/{workspaceId}/f/{fileId}/v/{versionNumber}/{safeFilename}`

## 9.2 Object Naming Principles
- do not depend on filename alone as object identity
- use database IDs in paths
- filenames may be included at the end for readability but must not control permissions

## 9.3 Bucket Strategy
Recommended for version 1:
- one primary private bucket for all app file objects

Optional later:
- separate bucket for previews/thumbnails
- separate immutable bucket for retention-critical records

---

## 10. API and Route Specification

## 10.1 Auth Routes
- `POST /api/auth/login`
- `POST /api/auth/logout`
- `POST /api/auth/request-password-reset`
- `POST /api/auth/reset-password`

Better Auth may manage some of these internally depending on integration.

## 10.2 Folder Routes
- `GET /api/folders/:id`
- `POST /api/folders`
- `PATCH /api/folders/:id`
- `POST /api/folders/:id/move`
- `DELETE /api/folders/:id`
- `POST /api/folders/:id/restore`

## 10.3 File Routes
- `GET /api/files/:id`
- `POST /api/files/initiate-upload`
- `POST /api/files/:id/complete-upload`
- `PATCH /api/files/:id`
- `POST /api/files/:id/move`
- `DELETE /api/files/:id`
- `POST /api/files/:id/restore`
- `POST /api/files/:id/download`
- `POST /api/files/:id/preview`

## 10.4 Share Routes
- `POST /api/shares`
- `PATCH /api/shares/:id`
- `DELETE /api/shares/:id`
- `GET /s/:token`

## 10.5 Admin Routes
- `GET /api/admin/users`
- `PATCH /api/admin/users/:id/role`
- `GET /api/admin/audit-logs`
- `GET /api/admin/share-links`
- `GET /api/admin/settings`
- `PATCH /api/admin/settings`

---

## 11. UI and UX Specification

## 11.1 Main Pages
### Public
- login page
- password reset pages
- public shared link page

### Authenticated
- dashboard
- my files
- folder detail page
- shared page
- deleted items
- settings

### Admin
- user management
- audit logs
- system settings
- link management

## 11.2 Core UI Components
- top navigation
- sidebar navigation
- file table or card grid
- breadcrumbs
- upload modal or drawer
- new folder modal
- share modal
- rename modal
- move modal
- delete confirmation dialog
- activity log drawer or page

## 11.3 UX Requirements
- upload feedback must be clear
- failed uploads must show useful retry states
- destructive actions must require confirmation
- permissions must be visible but not confusing
- public link pages should clearly show whether the file is view-only or downloadable

---

## 12. File and Sharing Behaviour Rules

## 12.1 File Status Lifecycle
Suggested statuses:
- pending
- ready
- failed
- deleted

### Rules
- pending files are not visible in normal browser lists unless uploader is viewing in-progress state
- failed files can be retried or deleted
- ready files are fully available according to permissions
- deleted files are hidden from normal listings

## 12.2 Share Link Lifecycle
Suggested states:
- active
- expired
- revoked

### Rules
- expired links cannot be used
- revoked links cannot be used
- deleted resources invalidate links automatically

---

## 13. Background Processing

## 13.1 Version 1 Background Needs
Keep background processing minimal.

Possible jobs:
- upload verification
- preview generation for PDFs and images if needed
- cleanup of expired uploads
- cleanup of expired share links metadata if needed
- hard delete after retention expiry

## 13.2 Implementation Approach
For version 1, background jobs can be implemented using:
- scheduled jobs
- Vercel cron for lightweight cleanup tasks
- database-driven polling job if needed

Avoid introducing heavy queue infrastructure unless there is real scale pressure.

---

## 14. Observability and Reliability

## 14.1 Error Monitoring
Use Sentry for:
- server errors
- route handler failures
- upload completion failures
- public share link failures
- admin action failures

## 14.2 Logging
Application logs should include:
- request context where safe
- upload failures
- storage signing failures
- auth failures
- permission denial events where relevant

## 14.3 Reliability Requirements
- failed upload finalisation must not produce orphaned active records
- failed download signing must not leak internal object paths
- app should degrade gracefully if preview fails

---

## 15. Performance Requirements

## 15.1 Expectations
- folder listing should remain responsive for normal company usage
- upload experience must support large files without routing binary data through the app server
- metadata queries should be indexed properly

## 15.2 Performance Strategies
- direct-to-B2 uploads
- database indexes for common list/search queries
- pagination on large listings
- lazy loading or pagination for audit log pages
- avoid loading deep folder trees in one request unnecessarily

---

## 16. Compliance and Governance Considerations

## 16.1 Internal Governance Goals
The system should support:
- traceability of actions
- controlled file sharing
- controlled access revocation
- retention-aware deletion

## 16.2 Privacy Considerations
- minimise public exposure
- avoid exposing internal emails in public pages unless necessary
- do not leak private metadata in share links

---

## 17. Environment Variables

Suggested environment variables:
- `DATABASE_URL`
- `BETTER_AUTH_SECRET`
- `APP_BASE_URL`
- `B2_S3_ENDPOINT`
- `B2_KEY_ID`
- `B2_APPLICATION_KEY`
- `B2_BUCKET_NAME`
- `RESEND_API_KEY`
- `SENTRY_DSN`
- `MAX_UPLOAD_SIZE_BYTES`
- `DEFAULT_SOFT_DELETE_RETENTION_DAYS`

---

## 18. Detailed Build Phases

## 18.1 Phase 1 - Foundation
Deliver:
- project setup
- auth setup
- user roles
- Neon schema setup
- B2 integration
- core layout
- protected routes

## 18.2 Phase 2 - Core File System
Deliver:
- folder CRUD
- file metadata CRUD
- initiate upload flow
- complete upload flow
- file listings
- breadcrumbs
- rename and move actions

## 18.3 Phase 3 - Sharing
Deliver:
- share modal
- share link generation
- public shared link page
- expiry and revoke logic
- view-only and download-enabled modes

## 18.4 Phase 4 - Recovery and Admin
Deliver:
- deleted items
- restore flow
- admin panel basics
- audit logs
- share link management
- system settings

## 18.5 Phase 5 - Quality and Hardening
Deliver:
- test coverage for critical flows
- permission hardening
- upload edge-case testing
- security review
- performance review
- production readiness checks

---

## 19. Testing Specification

## 19.1 Unit Test Targets
- permission utility functions
- share link validity logic
- folder tree validation rules
- file status transition rules
- retention calculation helpers

## 19.2 Integration Test Targets
- login flow
- authenticated access control
- upload initiation and completion
- signed download generation
- share link access with expiry
- delete and restore flow
- admin role protections

## 19.3 End-to-End Test Targets
- login and logout
- create folder
- upload file
- view file list
- share file
- open public share link
- revoke link
- delete and restore file

---

## 20. Production Readiness Checklist

Before launch, ensure:
- production env vars are set correctly
- B2 bucket permissions are validated
- all private downloads go through signed URLs only
- all sensitive routes are protected
- admin-only pages are enforced server-side
- audit logs are functioning
- delete/restore works correctly
- error monitoring is enabled
- file size limits are enforced
- blocked file type rules are enforced
- share link expiry works correctly
- password reset flow works correctly
- database backups are configured through provider policy

---

## 21. Suggested Agent Work Breakdown

## 21.1 Product/Architecture Agent
Responsible for:
- interpreting this specification
- refining any edge-case decisions
- maintaining source of truth docs

## 21.2 Frontend Agent
Responsible for:
- dashboard UI
- file browser UI
- folder navigation
- modals and forms
- public link pages

## 21.3 Backend Agent
Responsible for:
- auth integration
- route handlers
- permission middleware/utilities
- upload/download signing
- share link logic
- audit event writing

## 21.4 Database Agent
Responsible for:
- schema design in Drizzle
- migrations
- indexing
- query optimisation

## 21.5 QA Agent
Responsible for:
- flow validation
- access control testing
- share link testing
- upload edge-case testing
- delete and restore validation

---

## 22. Open Product Decisions to Confirm Before Build

These should be confirmed explicitly before implementation starts:

1. Should duplicate filenames in the same folder be allowed or auto-renamed?
2. Should all internal users see a company-wide shared root, or only their own private area unless granted access?
3. Should public share links be enabled for folders as well as files, or files only in version 1?
4. Should password-protected links be included in version 1 or moved to version 1.1?
5. Should file versioning be enabled from day one, or should version history be a later phase?
6. Should workspace-wide visibility be a default option, or should everything default to private?
7. What is the maximum upload size for initial deployment?
8. What file extensions should be blocked initially?
9. What should the default soft delete retention period be?
10. Should admins be able to impersonate access, or only override access through admin-only view mechanisms?

Recommended defaults:
- everything defaults to private
- duplicate names allowed but clearly shown
- public share links enabled for files in v1
- folder public sharing can be later if needed
- password-protected links optional in v1 if time allows
- version history optional but schema-ready
- 30-day soft delete retention

---

## 23. Recommended Initial Product Decisions

If no further clarification is given, implement these defaults:

- default visibility: private
- sharing: file-level public links enabled
- folder sharing: internal only in version 1
- link expiry: optional but available
- password-protected link: supported if practical in v1, otherwise phase 1.1
- preview support: images and PDFs only initially
- versioning: schema-ready, single active version behaviour in first release
- delete behaviour: soft delete first, 30-day retention
- restore behaviour: admin and owner permitted according to policy
- user roles: super_admin, admin, member

---

## 24. Final Build Instruction Summary

Build a secure, company-internal file management web application using Next.js, TypeScript, Neon PostgreSQL, Drizzle ORM, Better Auth, and Backblaze B2.

The application must:
- support authenticated internal users
- support role-based access and resource-level permissions
- allow folder creation and nested file organisation
- support browser-direct uploads to Backblaze B2
- support secure signed downloads
- support public share links with expiry and optional password protection
- support audit logging for critical actions
- support soft delete and restore
- include a minimal admin area for user, log, and share management
- avoid unnecessary infrastructure such as Redis in version 1
- prioritise secure server-side access checks and low operational complexity

This specification should be treated as the implementation source of truth unless superseded by a more detailed technical design.
