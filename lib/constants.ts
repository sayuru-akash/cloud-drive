export const DEFAULT_BLOCKED_FILE_EXTENSIONS = [
  "bat",
  "cmd",
  "com",
  "cpl",
  "dll",
  "exe",
  "hta",
  "jar",
  "js",
  "jse",
  "lnk",
  "msi",
  "msp",
  "pif",
  "ps1",
  "reg",
  "scr",
  "sh",
  "sys",
  "vb",
  "vbe",
  "wsf",
].sort();

export const BLOCKED_FILE_EXTENSIONS = new Set(DEFAULT_BLOCKED_FILE_EXTENSIONS);

export const ADMIN_ROLES = new Set(["admin", "super_admin"]);

export const RESOURCE_VISIBILITY_VALUES = ["private", "workspace"] as const;
export type ResourceVisibility = (typeof RESOURCE_VISIBILITY_VALUES)[number];

export const FILE_SORT_VALUES = [
  "updated-desc",
  "updated-asc",
  "name-asc",
  "name-desc",
  "size-desc",
  "size-asc",
] as const;
export type FileSortValue = (typeof FILE_SORT_VALUES)[number];
