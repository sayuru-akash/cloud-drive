export const summaryStats = [
  { label: "Pending uploads", value: "12", detail: "3 require verification" },
  { label: "Active links", value: "28", detail: "6 expire this week" },
  { label: "Deleted items", value: "9", detail: "30-day retention policy" },
  { label: "Policy checks", value: "100%", detail: "No blocked file violations" },
];

export const folderRows = [
  {
    name: "Executive / Board packs",
    owner: "Priya Menon",
    items: 24,
    visibility: "Private",
  },
  {
    name: "Operations / Regional hubs",
    owner: "Noah Lee",
    items: 67,
    visibility: "Workspace",
  },
  {
    name: "Legal / Signed contracts",
    owner: "Mia Carter",
    items: 18,
    visibility: "Restricted",
  },
];

export const fileRows = [
  {
    name: "pricing-model-v7.xlsx",
    type: "Spreadsheet",
    size: "4.8 MB",
    owner: "Priya Menon",
    visibility: "Private",
    modified: "2h ago",
  },
  {
    name: "partner-renewal-redlines.pdf",
    type: "PDF",
    size: "12.1 MB",
    owner: "Mia Carter",
    visibility: "Shared",
    modified: "5h ago",
  },
  {
    name: "warehouse-onboarding.mp4",
    type: "Video",
    size: "184 MB",
    owner: "Noah Lee",
    visibility: "Workspace",
    modified: "Yesterday",
  },
];

export const shareLinks = [
  {
    name: "partner-renewal-redlines.pdf",
    mode: "View only with 7-day expiry",
    expires: "in 7 days",
  },
  {
    name: "warehouse-onboarding.mp4",
    mode: "Download enabled for internal users",
    expires: "workspace policy",
  },
  {
    name: "q2-board-pack.pdf",
    mode: "Password-protected public view link",
    expires: "tomorrow",
  },
];

export const deletedItems = [
  {
    name: "legacy-pricing-archive.zip",
    deletedAt: "18 Apr",
    reason: "Superseded by current archive",
    remaining: "29 days",
  },
  {
    name: "old-regional-playbook",
    deletedAt: "17 Apr",
    reason: "Folder cleanup after migration",
    remaining: "28 days",
  },
];

export const activityFeed = [
  {
    title: "Upload session completed",
    detail:
      "pricing-model-v7.xlsx moved from pending to ready after signed storage verification.",
    when: "2026-04-19T08:42Z",
  },
  {
    title: "Admin revoked public link",
    detail:
      "The share token for q2-board-pack.pdf was invalidated after a policy review.",
    when: "2026-04-19T07:16Z",
  },
  {
    title: "Deleted file restored",
    detail:
      "legacy-pricing-archive.zip returned to its original folder before retention expiry.",
    when: "2026-04-18T16:03Z",
  },
];

export const adminChecks = [
  {
    title: "Upload guardrails",
    detail:
      "Environment scaffolding includes configurable max upload size and retention defaults so file policy is not hardcoded into the UI layer.",
  },
  {
    title: "Sharing governance",
    detail:
      "The admin route is shaped for revocation, expiry review, and future password-protected link enforcement.",
  },
  {
    title: "Audit readiness",
    detail:
      "Activity surfaces are framed around immutable event types such as upload completion, revoke, delete, and restore.",
  },
  {
    title: "Protected route model",
    detail:
      "The workspace group cleanly separates internal surfaces from marketing pages so auth wiring can be added without route churn.",
  },
];
