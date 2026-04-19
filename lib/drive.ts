import "server-only";
import { and, count, desc, eq, inArray, isNull, sql } from "drizzle-orm";
import { db } from "@/lib/db/client";
import {
  fileVersions,
  files,
  folders,
  shareLinks,
  uploads,
  users,
} from "@/lib/db/schema";
import { ADMIN_ROLES } from "@/lib/constants";

export function canManageAdmin(userRole?: string | null) {
  return ADMIN_ROLES.has(userRole ?? "");
}

export function canAccessResource({
  userId,
  userRole,
  ownerUserId,
  visibility,
}: {
  userId: string;
  userRole?: string | null;
  ownerUserId: string;
  visibility: "private" | "workspace";
}) {
  if (canManageAdmin(userRole)) {
    return true;
  }

  if (ownerUserId === userId) {
    return true;
  }

  return visibility === "workspace";
}

export async function getFolderAncestors(folderId: string | null) {
  if (!folderId) {
    return [];
  }

  const trail: Array<{ id: string; name: string }> = [];
  let currentId: string | null = folderId;

  while (currentId) {
    const [folder] = await db
      .select({
        id: folders.id,
        name: folders.name,
        parentFolderId: folders.parentFolderId,
      })
      .from(folders)
      .where(eq(folders.id, currentId))
      .limit(1);

    if (!folder) {
      break;
    }

    trail.unshift({ id: folder.id, name: folder.name });
    currentId = folder.parentFolderId;
  }

  return trail;
}

export async function getFolderContents({
  folderId,
  userId,
  userRole,
}: {
  folderId: string | null;
  userId: string;
  userRole?: string | null;
}) {
  const folderPredicate = folderId
    ? eq(folders.parentFolderId, folderId)
    : isNull(folders.parentFolderId);

  const filePredicate = folderId ? eq(files.folderId, folderId) : isNull(files.folderId);

  const folderRows = await db
    .select({
      id: folders.id,
      name: folders.name,
      ownerUserId: folders.ownerUserId,
      visibility: folders.visibility,
      updatedAt: folders.updatedAt,
    })
    .from(folders)
    .where(and(folderPredicate, eq(folders.isDeleted, false)))
    .orderBy(folders.name);

  const fileRows = await db
    .select({
      id: files.id,
      displayName: files.displayName,
      ownerUserId: files.ownerUserId,
      visibility: files.visibility,
      status: files.status,
      mimeType: files.mimeType,
      sizeBytes: files.sizeBytes,
      updatedAt: files.updatedAt,
    })
    .from(files)
    .where(and(filePredicate, eq(files.isDeleted, false), eq(files.status, "ready")))
    .orderBy(desc(files.updatedAt));

  return {
    folders: folderRows.filter((row) =>
      canAccessResource({
        userId,
        userRole,
        ownerUserId: row.ownerUserId,
        visibility: row.visibility,
      }),
    ),
    files: fileRows.filter((row) =>
      canAccessResource({
        userId,
        userRole,
        ownerUserId: row.ownerUserId,
        visibility: row.visibility,
      }),
    ),
  };
}

export async function getFileRecord(fileId: string) {
  const [file] = await db
    .select({
      id: files.id,
      folderId: files.folderId,
      ownerUserId: files.ownerUserId,
      createdByUserId: files.createdByUserId,
      displayName: files.displayName,
      originalName: files.originalName,
      mimeType: files.mimeType,
      sizeBytes: files.sizeBytes,
      status: files.status,
      visibility: files.visibility,
      isDeleted: files.isDeleted,
      currentVersionId: files.currentVersionId,
    })
    .from(files)
    .where(eq(files.id, fileId))
    .limit(1);

  return file ?? null;
}

export async function getCurrentFileVersion(fileId: string) {
  const [version] = await db
    .select({
      id: fileVersions.id,
      storageKey: fileVersions.storageKey,
      sizeBytes: fileVersions.sizeBytes,
      mimeType: fileVersions.mimeType,
      createdAt: fileVersions.createdAt,
    })
    .from(fileVersions)
    .innerJoin(files, eq(fileVersions.id, files.currentVersionId))
    .where(eq(files.id, fileId))
    .limit(1);

  return version ?? null;
}

export async function getDashboardData(userId: string, userRole?: string | null) {
  const [pendingUploads] = await db
    .select({ value: count() })
    .from(uploads)
    .where(
      and(
        eq(uploads.initiatedByUserId, userId),
        inArray(uploads.uploadStatus, ["initiated", "uploading"]),
      ),
    );

  const [activeLinks] = await db
    .select({ value: count() })
    .from(shareLinks)
    .where(
      canManageAdmin(userRole)
        ? eq(shareLinks.isRevoked, false)
        : and(
            eq(shareLinks.isRevoked, false),
            eq(shareLinks.createdByUserId, userId),
          ),
    );

  const [deletedFiles] = await db
    .select({ value: count() })
    .from(files)
    .where(
      canManageAdmin(userRole)
        ? eq(files.isDeleted, true)
        : and(eq(files.isDeleted, true), eq(files.ownerUserId, userId)),
    );

  const [workspaceFiles] = await db
    .select({ value: count() })
    .from(files)
    .where(eq(files.visibility, "workspace"));

  const recentUploads = await db
    .select({
      id: files.id,
      name: files.displayName,
      mimeType: files.mimeType,
      sizeBytes: files.sizeBytes,
      updatedAt: files.updatedAt,
      ownerName: users.name,
    })
    .from(files)
    .leftJoin(users, eq(files.ownerUserId, users.id))
    .where(
      canManageAdmin(userRole)
        ? and(eq(files.isDeleted, false), eq(files.status, "ready"))
        : and(
            eq(files.isDeleted, false),
            eq(files.status, "ready"),
            eq(files.ownerUserId, userId),
          ),
    )
    .orderBy(desc(files.updatedAt))
    .limit(5);

  return {
    summary: {
      pendingUploads: pendingUploads?.value ?? 0,
      activeLinks: activeLinks?.value ?? 0,
      deletedFiles: deletedFiles?.value ?? 0,
      workspaceFiles: workspaceFiles?.value ?? 0,
    },
    recentUploads,
  };
}

export async function getDeletedResources(userId: string, userRole?: string | null) {
  const deletedFileWhere = canManageAdmin(userRole)
    ? eq(files.isDeleted, true)
    : and(eq(files.isDeleted, true), eq(files.ownerUserId, userId));

  const deletedFolderWhere = canManageAdmin(userRole)
    ? eq(folders.isDeleted, true)
    : and(eq(folders.isDeleted, true), eq(folders.ownerUserId, userId));

  const [deletedFilesRows, deletedFolderRows] = await Promise.all([
    db
      .select({
        id: files.id,
        name: files.displayName,
        deletedAt: files.deletedAt,
        type: sql<string>`'file'`,
      })
      .from(files)
      .where(deletedFileWhere)
      .orderBy(desc(files.deletedAt)),
    db
      .select({
        id: folders.id,
        name: folders.name,
        deletedAt: folders.deletedAt,
        type: sql<string>`'folder'`,
      })
      .from(folders)
      .where(deletedFolderWhere)
      .orderBy(desc(folders.deletedAt)),
  ]);

  return [...deletedFilesRows, ...deletedFolderRows].sort((a, b) =>
    String(b.deletedAt).localeCompare(String(a.deletedAt)),
  );
}
