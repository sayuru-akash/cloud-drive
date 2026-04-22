import "server-only";
import { and, count, eq, isNull, desc, gt, or } from "drizzle-orm";
import { db } from "@/lib/db/client";
import {
  fileVersions,
  files,
  folders,
  shareLinks,
  uploads,
  users,
} from "@/lib/db/schema";
import { ADMIN_ROLES, type FileSortValue, type ResourceVisibility } from "@/lib/constants";

export function canManageAdmin(userRole?: string | null) {
  return ADMIN_ROLES.has(userRole ?? "");
}

export function canViewResource({
  userId,
  userRole,
  ownerUserId,
  visibility,
}: {
  userId: string;
  userRole?: string | null;
  ownerUserId: string;
  visibility: ResourceVisibility;
}) {
  if (canManageAdmin(userRole)) {
    return true;
  }

  if (ownerUserId === userId) {
    return true;
  }

  return visibility === "workspace";
}

export const canAccessResource = canViewResource;

export function canManageResource({
  userId,
  userRole,
  ownerUserId,
}: {
  userId: string;
  userRole?: string | null;
  ownerUserId: string;
}) {
  return canManageAdmin(userRole) || ownerUserId === userId;
}

export const canEditResource = canManageResource;
export const canDeleteResource = canManageResource;
export const canShareResource = canManageResource;

type SortableItem = {
  updatedAt: Date;
  name: string;
  sizeBytes?: number | null;
};

export function sortItems<T extends SortableItem>(items: T[], sort: FileSortValue) {
  return [...items].sort((left, right) => {
    switch (sort) {
      case "updated-asc":
        return left.updatedAt.getTime() - right.updatedAt.getTime();
      case "name-asc":
        return left.name.localeCompare(right.name);
      case "name-desc":
        return right.name.localeCompare(left.name);
      case "size-desc":
        return Number(right.sizeBytes ?? 0) - Number(left.sizeBytes ?? 0);
      case "size-asc":
        return Number(left.sizeBytes ?? 0) - Number(right.sizeBytes ?? 0);
      case "updated-desc":
      default:
        return right.updatedAt.getTime() - left.updatedAt.getTime();
    }
  });
}

export function isWithinDateRange(value: Date, from?: string, to?: string) {
  const current = value.getTime();

  if (from) {
    const fromDate = new Date(from);

    if (!Number.isNaN(fromDate.getTime()) && current < fromDate.getTime()) {
      return false;
    }
  }

  if (to) {
    const toDate = new Date(to);

    if (!Number.isNaN(toDate.getTime())) {
      toDate.setHours(23, 59, 59, 999);

      if (current > toDate.getTime()) {
        return false;
      }
    }
  }

  return true;
}

export function resolveUniqueName(existingNames: string[], desiredName: string) {
  const trimmed = desiredName.trim();

  if (!trimmed) {
    return "";
  }

  const existing = new Set(existingNames.map((value) => value.toLowerCase()));

  if (!existing.has(trimmed.toLowerCase())) {
    return trimmed;
  }

  const extensionIndex = trimmed.lastIndexOf(".");
  const hasExtension = extensionIndex > 0 && extensionIndex < trimmed.length - 1;
  const baseName = hasExtension ? trimmed.slice(0, extensionIndex) : trimmed;
  const extension = hasExtension ? trimmed.slice(extensionIndex) : "";

  let counter = 1;

  while (true) {
    const candidate = `${baseName} (${counter})${extension}`;

    if (!existing.has(candidate.toLowerCase())) {
      return candidate;
    }

    counter += 1;
  }
}

export async function ensureUniqueFolderName(
  parentFolderId: string | null,
  desiredName: string,
  excludeFolderId?: string,
) {
  const rows = await db
    .select({
      name: folders.name,
      id: folders.id,
    })
    .from(folders)
    .where(
      and(
        parentFolderId ? eq(folders.parentFolderId, parentFolderId) : isNull(folders.parentFolderId),
        eq(folders.isDeleted, false),
      ),
    );

  const existing = rows
    .filter((row) => row.id !== excludeFolderId)
    .map((row) => row.name);

  return resolveUniqueName(existing, desiredName);
}

export async function ensureUniqueFileName(
  folderId: string | null,
  desiredName: string,
  excludeFileId?: string,
) {
  const rows = await db
    .select({
      name: files.displayName,
      id: files.id,
    })
    .from(files)
    .where(
      and(folderId ? eq(files.folderId, folderId) : isNull(files.folderId), eq(files.isDeleted, false)),
    );

  const existing = rows
    .filter((row) => row.id !== excludeFileId)
    .map((row) => row.name);

  return resolveUniqueName(existing, desiredName);
}

export async function collectDescendantFolderIds(rootFolderId: string) {
  const allIds = [rootFolderId];
  const queue = [rootFolderId];

  while (queue.length > 0) {
    const current = queue.shift();

    if (!current) {
      continue;
    }

    const children = await db
      .select({ id: folders.id })
      .from(folders)
      .where(eq(folders.parentFolderId, current));

    for (const child of children) {
      allIds.push(child.id);
      queue.push(child.id);
    }
  }

  return allIds;
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

export async function getAccessibleFolderOptions({
  userId,
  userRole,
  excludeFolderId,
}: {
  userId: string;
  userRole?: string | null;
  excludeFolderId?: string;
}) {
  const excludedIds = excludeFolderId
    ? new Set(await collectDescendantFolderIds(excludeFolderId))
    : new Set<string>();

  const rows = await db
    .select({
      id: folders.id,
      name: folders.name,
      ownerUserId: folders.ownerUserId,
      visibility: folders.visibility,
      parentFolderId: folders.parentFolderId,
    })
    .from(folders)
    .where(eq(folders.isDeleted, false));

  const editable = rows.filter((row) => {
    if (excludedIds.has(row.id)) {
      return false;
    }

    return canEditResource({
      userId,
      userRole,
      ownerUserId: row.ownerUserId,
    });
  });

  const items: Array<{ id: string; path: string }> = [];

  for (const row of editable) {
    const ancestors = await getFolderAncestors(row.id);
    items.push({
      id: row.id,
      path: ancestors.map((ancestor) => ancestor.name).join(" / "),
    });
  }

  return items.sort((left, right) => left.path.localeCompare(right.path));
}

export type FolderNode = {
  id: string;
  name: string;
  children: FolderNode[];
};

export async function getFolderTree(
  userId: string,
  userRole?: string | null,
): Promise<FolderNode[]> {
  const rows = await db
    .select({
      id: folders.id,
      name: folders.name,
      ownerUserId: folders.ownerUserId,
      visibility: folders.visibility,
      parentFolderId: folders.parentFolderId,
    })
    .from(folders)
    .where(eq(folders.isDeleted, false));

  const accessible = rows.filter((row) =>
    canViewResource({
      userId,
      userRole,
      ownerUserId: row.ownerUserId,
      visibility: row.visibility,
    }),
  );

  const map = new Map<string, FolderNode>();
  for (const row of accessible) {
    map.set(row.id, { id: row.id, name: row.name, children: [] });
  }

  const roots: FolderNode[] = [];
  for (const row of accessible) {
    const node = map.get(row.id)!;
    if (row.parentFolderId && map.has(row.parentFolderId)) {
      map.get(row.parentFolderId)!.children.push(node);
    } else {
      roots.push(node);
    }
  }

  return roots.sort((a, b) => a.name.localeCompare(b.name));
}

export async function getFolderContents({
  folderId,
  userId,
  userRole,
  query,
  fileType,
  visibility,
  ownerId,
  sort = "updated-desc",
  updatedAfter,
  updatedBefore,
}: {
  folderId: string | null;
  userId: string;
  userRole?: string | null;
  query?: string;
  fileType?: string;
  visibility?: ResourceVisibility | "all";
  ownerId?: string;
  sort?: FileSortValue;
  updatedAfter?: string;
  updatedBefore?: string;
}) {
  const folderPredicate = folderId
    ? eq(folders.parentFolderId, folderId)
    : isNull(folders.parentFolderId);

  const filePredicate = folderId ? eq(files.folderId, folderId) : isNull(files.folderId);

  const [folderRows, fileRows] = await Promise.all([
    db
      .select({
        id: folders.id,
        name: folders.name,
        ownerUserId: folders.ownerUserId,
        ownerName: users.name,
        visibility: folders.visibility,
        updatedAt: folders.updatedAt,
      })
      .from(folders)
      .leftJoin(users, eq(folders.ownerUserId, users.id))
      .where(and(folderPredicate, eq(folders.isDeleted, false))),
    db
      .select({
        id: files.id,
        folderId: files.folderId,
        displayName: files.displayName,
        ownerUserId: files.ownerUserId,
        ownerName: users.name,
        visibility: files.visibility,
        status: files.status,
        mimeType: files.mimeType,
        sizeBytes: files.sizeBytes,
        updatedAt: files.updatedAt,
      })
      .from(files)
      .leftJoin(users, eq(files.ownerUserId, users.id))
      .where(and(filePredicate, eq(files.isDeleted, false), eq(files.status, "ready"))),
  ]);

  const visibleFolders = folderRows.filter((row) =>
    canViewResource({
      userId,
      userRole,
      ownerUserId: row.ownerUserId,
      visibility: row.visibility,
    }),
  );

  const visibleFiles = fileRows.filter((row) =>
    canViewResource({
      userId,
      userRole,
      ownerUserId: row.ownerUserId,
      visibility: row.visibility,
    }),
  );

  const searchQuery = query?.trim().toLowerCase();
  const requestedVisibility = visibility && visibility !== "all" ? visibility : null;
  const requestedType = fileType && fileType !== "all" ? fileType.toLowerCase() : null;
  const requestedOwnerId = ownerId && ownerId !== "all" ? ownerId : null;

  const filteredFolders = sortItems(
    visibleFolders
      .filter((row) => !requestedVisibility || row.visibility === requestedVisibility)
      .filter((row) => !requestedOwnerId || row.ownerUserId === requestedOwnerId)
      .filter((row) => !searchQuery || row.name.toLowerCase().includes(searchQuery))
      .filter((row) => isWithinDateRange(row.updatedAt, updatedAfter, updatedBefore))
      .map((row) => ({
        ...row,
        sizeBytes: 0,
      })),
    sort,
  );

  const filteredFiles = sortItems(
    visibleFiles
      .filter((row) => !requestedVisibility || row.visibility === requestedVisibility)
      .filter((row) => !requestedOwnerId || row.ownerUserId === requestedOwnerId)
      .filter((row) => !searchQuery || row.displayName.toLowerCase().includes(searchQuery))
      .filter((row) => !requestedType || row.mimeType.toLowerCase().includes(requestedType))
      .filter((row) => isWithinDateRange(row.updatedAt, updatedAfter, updatedBefore))
      .map((row) => ({
        ...row,
        name: row.displayName,
      })),
    sort,
  );

  const availableOwners = Array.from(
    new Map(
      [...visibleFolders, ...visibleFiles].map((row) => [
        row.ownerUserId,
        {
          id: row.ownerUserId,
          name: row.ownerName ?? "Unknown",
        },
      ]),
    ).values(),
  ).sort((left, right) => left.name.localeCompare(right.name));

  const availableFileTypes = Array.from(
    new Set(
      visibleFiles
        .map((row) => row.mimeType)
        .filter(Boolean)
        .sort(),
    ),
  );

  return {
    folders: filteredFolders,
    files: filteredFiles,
    availableOwners,
    availableFileTypes,
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
      deletedAt: files.deletedAt,
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

export async function getPendingUploads(userId: string, limit?: number) {
  const query = db
    .select({
      uploadId: uploads.id,
      fileId: files.id,
      fileName: files.displayName,
      originalName: files.originalName,
      mimeType: files.mimeType,
      folderId: files.folderId,
      folderName: folders.name,
      sizeBytes: uploads.sizeBytes,
      createdAt: uploads.createdAt,
      expiresAt: uploads.expiresAt,
    })
    .from(uploads)
    .innerJoin(files, eq(uploads.fileId, files.id))
    .leftJoin(folders, eq(files.folderId, folders.id))
    .where(
      and(
        eq(uploads.initiatedByUserId, userId),
        eq(uploads.uploadStatus, "initiated"),
        eq(files.isDeleted, false),
      ),
    )
    .orderBy(desc(uploads.createdAt));

  const rows = limit ? await query.limit(limit) : await query;

  return rows;
}

export async function getDashboardData(userId: string, userRole?: string | null) {
  const isAdmin = canManageAdmin(userRole);

  const [pendingUploads] = await db
    .select({ value: count() })
    .from(uploads)
    .where(
      and(
        eq(uploads.initiatedByUserId, userId),
        eq(uploads.uploadStatus, "initiated"),
      ),
    );

  const [activeLinks] = await db
    .select({ value: count() })
    .from(shareLinks)
    .leftJoin(files, eq(shareLinks.resourceId, files.id))
    .where(
      isAdmin
        ? and(
            eq(shareLinks.resourceType, "file"),
            eq(shareLinks.isRevoked, false),
            eq(files.isDeleted, false),
            eq(files.status, "ready"),
            or(isNull(shareLinks.expiresAt), gt(shareLinks.expiresAt, new Date())),
          )
        : and(
            eq(shareLinks.resourceType, "file"),
            eq(shareLinks.isRevoked, false),
            eq(shareLinks.createdByUserId, userId),
            eq(files.isDeleted, false),
            eq(files.status, "ready"),
            or(isNull(shareLinks.expiresAt), gt(shareLinks.expiresAt, new Date())),
          ),
    );

  const [deletedFiles, deletedFolders] = await Promise.all([
    db
      .select({ value: count() })
      .from(files)
      .where(
        isAdmin
          ? eq(files.isDeleted, true)
          : and(eq(files.isDeleted, true), eq(files.ownerUserId, userId)),
      )
      .then((rows) => rows[0]),
    db
      .select({ value: count() })
      .from(folders)
      .where(
        isAdmin
          ? eq(folders.isDeleted, true)
          : and(eq(folders.isDeleted, true), eq(folders.ownerUserId, userId)),
      )
      .then((rows) => rows[0]),
  ]);

  const [totalFiles] = await db
    .select({ value: count() })
    .from(files)
    .where(
      isAdmin
        ? and(eq(files.isDeleted, false), eq(files.status, "ready"))
        : and(
            eq(files.isDeleted, false),
            eq(files.status, "ready"),
            or(eq(files.ownerUserId, userId), eq(files.visibility, "workspace")),
          ),
    );

  const recentUploads = await db
    .select({
      id: files.id,
      name: files.displayName,
      mimeType: files.mimeType,
      sizeBytes: files.sizeBytes,
      updatedAt: files.updatedAt,
      ownerName: users.name,
      folderId: files.folderId,
      folderName: folders.name,
    })
    .from(files)
    .leftJoin(users, eq(files.ownerUserId, users.id))
    .leftJoin(folders, eq(files.folderId, folders.id))
    .where(
      isAdmin
        ? and(eq(files.isDeleted, false), eq(files.status, "ready"))
        : and(
            eq(files.isDeleted, false),
            eq(files.status, "ready"),
            or(eq(files.ownerUserId, userId), eq(files.visibility, "workspace")),
          ),
    )
    .orderBy(desc(files.updatedAt))
    .limit(5);

  const pendingUploadItems = await getPendingUploads(userId, 4);

  return {
    summary: {
      pendingUploads: pendingUploads?.value ?? 0,
      activeLinks: activeLinks?.value ?? 0,
      deletedItems: Number(deletedFiles?.value ?? 0) + Number(deletedFolders?.value ?? 0),
      totalFiles: totalFiles?.value ?? 0,
    },
    pendingUploads: pendingUploadItems,
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
        ownerUserId: files.ownerUserId,
        deletedAt: files.deletedAt,
      })
      .from(files)
      .where(deletedFileWhere)
      .orderBy(desc(files.deletedAt)),
    db
      .select({
        id: folders.id,
        name: folders.name,
        ownerUserId: folders.ownerUserId,
        deletedAt: folders.deletedAt,
      })
      .from(folders)
      .where(deletedFolderWhere)
      .orderBy(desc(folders.deletedAt)),
  ]);

  const normalized = [
    ...deletedFilesRows.map((row) => ({
      id: row.id,
      name: row.name,
      ownerUserId: row.ownerUserId,
      deletedAt: row.deletedAt,
      type: "file" as const,
    })),
    ...deletedFolderRows.map((row) => ({
      id: row.id,
      name: row.name,
      ownerUserId: row.ownerUserId,
      deletedAt: row.deletedAt,
      type: "folder" as const,
    })),
  ];

  return normalized.sort((left, right) =>
    String(right.deletedAt).localeCompare(String(left.deletedAt)),
  );
}
