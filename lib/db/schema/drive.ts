import { relations, sql } from "drizzle-orm";
import {
  bigint,
  boolean,
  index,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import { users } from "@/lib/db/schema/auth";

export const resourceVisibilityEnum = pgEnum("resource_visibility", [
  "private",
  "workspace",
]);

export const fileStatusEnum = pgEnum("file_status", [
  "pending",
  "ready",
  "failed",
  "deleted",
]);

export const uploadStatusEnum = pgEnum("upload_status", [
  "initiated",
  "uploading",
  "completed",
  "failed",
  "cancelled",
]);

export const shareModeEnum = pgEnum("share_mode", ["view", "download"]);

export const shareResourceTypeEnum = pgEnum("share_resource_type", [
  "file",
  "folder",
]);

export const folders = pgTable(
  "folders",
  {
    id: text("id").primaryKey(),
    parentFolderId: text("parent_folder_id"),
    name: text("name").notNull(),
    ownerUserId: text("owner_user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    createdByUserId: text("created_by_user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    visibility: resourceVisibilityEnum("visibility").default("private").notNull(),
    isDeleted: boolean("is_deleted").default(false).notNull(),
    deletedAt: timestamp("deleted_at"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [
    index("folders_parent_folder_id_idx").on(table.parentFolderId),
    index("folders_owner_user_id_idx").on(table.ownerUserId),
    index("folders_is_deleted_idx").on(table.isDeleted),
  ],
);

export const files = pgTable(
  "files",
  {
    id: text("id").primaryKey(),
    folderId: text("folder_id").references(() => folders.id, {
      onDelete: "set null",
    }),
    ownerUserId: text("owner_user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    createdByUserId: text("created_by_user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    originalName: text("original_name").notNull(),
    displayName: text("display_name").notNull(),
    extension: text("extension"),
    mimeType: text("mime_type").notNull(),
    sizeBytes: bigint("size_bytes", { mode: "number" }).default(0).notNull(),
    checksum: text("checksum"),
    status: fileStatusEnum("status").default("pending").notNull(),
    visibility: resourceVisibilityEnum("visibility").default("private").notNull(),
    isDeleted: boolean("is_deleted").default(false).notNull(),
    deletedAt: timestamp("deleted_at"),
    currentVersionId: text("current_version_id"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [
    index("files_folder_id_idx").on(table.folderId),
    index("files_owner_user_id_idx").on(table.ownerUserId),
    index("files_status_idx").on(table.status),
    index("files_is_deleted_idx").on(table.isDeleted),
  ],
);

export const fileVersions = pgTable(
  "file_versions",
  {
    id: text("id").primaryKey(),
    fileId: text("file_id")
      .notNull()
      .references(() => files.id, { onDelete: "cascade" }),
    versionNumber: integer("version_number").notNull(),
    storageBucket: text("storage_bucket").notNull(),
    storageKey: text("storage_key").notNull(),
    sizeBytes: bigint("size_bytes", { mode: "number" }).notNull(),
    mimeType: text("mime_type").notNull(),
    checksum: text("checksum"),
    uploadedByUserId: text("uploaded_by_user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex("file_versions_file_id_version_number_idx").on(
      table.fileId,
      table.versionNumber,
    ),
    uniqueIndex("file_versions_storage_key_idx").on(table.storageKey),
  ],
);

export const uploads = pgTable(
  "uploads",
  {
    id: text("id").primaryKey(),
    fileId: text("file_id")
      .notNull()
      .references(() => files.id, { onDelete: "cascade" }),
    initiatedByUserId: text("initiated_by_user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    uploadStatus: uploadStatusEnum("upload_status").default("initiated").notNull(),
    storageKey: text("storage_key").notNull(),
    contentType: text("content_type").notNull(),
    sizeBytes: bigint("size_bytes", { mode: "number" }).notNull(),
    expiresAt: timestamp("expires_at").notNull(),
    completedAt: timestamp("completed_at"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [
    index("uploads_file_id_idx").on(table.fileId),
    index("uploads_initiated_by_user_id_idx").on(table.initiatedByUserId),
    index("uploads_upload_status_idx").on(table.uploadStatus),
  ],
);

export const shareLinks = pgTable(
  "share_links",
  {
    id: text("id").primaryKey(),
    resourceType: shareResourceTypeEnum("resource_type").notNull(),
    resourceId: text("resource_id").notNull(),
    tokenHash: text("token_hash").notNull().unique(),
    createdByUserId: text("created_by_user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    mode: shareModeEnum("mode").default("view").notNull(),
    passwordHash: text("password_hash"),
    expiresAt: timestamp("expires_at"),
    isRevoked: boolean("is_revoked").default(false).notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [
    index("share_links_resource_idx").on(table.resourceType, table.resourceId),
    index("share_links_created_by_user_id_idx").on(table.createdByUserId),
    index("share_links_expires_at_idx").on(table.expiresAt),
  ],
);

export const auditLogs = pgTable(
  "audit_logs",
  {
    id: text("id").primaryKey(),
    actorUserId: text("actor_user_id").references(() => users.id, {
      onDelete: "set null",
    }),
    actorEmail: text("actor_email"),
    actionType: text("action_type").notNull(),
    resourceType: text("resource_type"),
    resourceId: text("resource_id"),
    ipAddress: text("ip_address"),
    userAgent: text("user_agent"),
    metadataJson: jsonb("metadata_json").default(sql`'{}'::jsonb`).notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [
    index("audit_logs_actor_user_id_idx").on(table.actorUserId),
    index("audit_logs_action_type_idx").on(table.actionType),
    index("audit_logs_created_at_idx").on(table.createdAt),
  ],
);

export const appSettings = pgTable("app_settings", {
  key: text("key").primaryKey(),
  value: jsonb("value").default(sql`'{}'::jsonb`).notNull(),
  updatedByUserId: text("updated_by_user_id").references(() => users.id, {
    onDelete: "set null",
  }),
  updatedAt: timestamp("updated_at")
    .defaultNow()
    .$onUpdate(() => new Date())
    .notNull(),
});

export const foldersRelations = relations(folders, ({ one, many }) => ({
  parent: one(folders, {
    fields: [folders.parentFolderId],
    references: [folders.id],
    relationName: "folder_parent",
  }),
  children: many(folders, { relationName: "folder_parent" }),
  files: many(files),
}));

export const filesRelations = relations(files, ({ one, many }) => ({
  folder: one(folders, {
    fields: [files.folderId],
    references: [folders.id],
  }),
  currentVersion: one(fileVersions, {
    fields: [files.currentVersionId],
    references: [fileVersions.id],
  }),
  versions: many(fileVersions),
  uploads: many(uploads),
}));

export const fileVersionsRelations = relations(fileVersions, ({ one }) => ({
  file: one(files, {
    fields: [fileVersions.fileId],
    references: [files.id],
  }),
}));

export const uploadsRelations = relations(uploads, ({ one }) => ({
  file: one(files, {
    fields: [uploads.fileId],
    references: [files.id],
  }),
}));
