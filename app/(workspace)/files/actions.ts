"use server";

import { and, eq, inArray } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { getAppSettings } from "@/lib/app-settings";
import { logAuditEvent } from "@/lib/audit";
import { requireAdminSession, requireSession } from "@/lib/auth/session";
import { ADMIN_ROLES, RESOURCE_VISIBILITY_VALUES } from "@/lib/constants";
import { db } from "@/lib/db/client";
import { fileVersions, files, folders, shareLinks } from "@/lib/db/schema";
import {
  canDeleteResource,
  canEditResource,
  canManageAdmin,
  canShareResource,
  collectDescendantFolderIds,
  ensureUniqueFileName,
  ensureUniqueFolderName,
  getFileRecord,
} from "@/lib/drive";
import { sendShareLinkEmail } from "@/lib/email";
import { env } from "@/lib/env";
import { createId, createShareToken, hashValue } from "@/lib/ids";
import { deleteStoredObject } from "@/lib/storage";

function revalidateWorkspace() {
  for (const path of ["/dashboard", "/files", "/shared", "/deleted", "/settings", "/admin"]) {
    revalidatePath(path);
  }
}

function getVisibilityValue(input: FormDataEntryValue | null) {
  return input === "workspace" ? "workspace" : "private";
}

function isWithinRetentionWindow(date: Date | null, retentionDays: number) {
  if (!date) {
    return true;
  }

  const deadline = new Date(date);
  deadline.setDate(deadline.getDate() + retentionDays);

  return deadline.getTime() >= Date.now();
}

async function getManagedFolder(folderId: string) {
  const [folder] = await db
    .select({
      id: folders.id,
      name: folders.name,
      parentFolderId: folders.parentFolderId,
      ownerUserId: folders.ownerUserId,
      visibility: folders.visibility,
      isDeleted: folders.isDeleted,
      deletedAt: folders.deletedAt,
    })
    .from(folders)
    .where(eq(folders.id, folderId))
    .limit(1);

  return folder ?? null;
}

export async function createFolderAction(formData: FormData) {
  const session = await requireSession();
  const name = String(formData.get("name") ?? "").trim();
  const parentFolderId = String(formData.get("parentFolderId") ?? "").trim() || null;
  const visibility = getVisibilityValue(formData.get("visibility"));

  if (!name) {
    return;
  }

  if (parentFolderId) {
    const parent = await getManagedFolder(parentFolderId);

    if (!parent || parent.isDeleted) {
      return;
    }

    if (
      !canEditResource({
        userId: session.user.id,
        userRole: session.user.role,
        ownerUserId: parent.ownerUserId,
      })
    ) {
      return;
    }
  }

  const folderId = createId("folder");
  const resolvedName = await ensureUniqueFolderName(parentFolderId, name);

  await db.insert(folders).values({
    id: folderId,
    parentFolderId,
    name: resolvedName,
    ownerUserId: session.user.id,
    createdByUserId: session.user.id,
    visibility,
  });

  await logAuditEvent({
    actorUserId: session.user.id,
    actorEmail: session.user.email,
    actionType: "folder.created",
    resourceType: "folder",
    resourceId: folderId,
    metadataJson: {
      name: resolvedName,
      parentFolderId,
      visibility,
    },
  });

  revalidateWorkspace();
}

export async function renameFolderAction(formData: FormData) {
  const session = await requireSession();
  const folderId = String(formData.get("folderId") ?? "");
  const name = String(formData.get("name") ?? "").trim();

  if (!folderId || !name) {
    return;
  }

  const folder = await getManagedFolder(folderId);

  if (!folder || folder.isDeleted) {
    return;
  }

  if (
    !canEditResource({
      userId: session.user.id,
      userRole: session.user.role,
      ownerUserId: folder.ownerUserId,
    })
  ) {
    return;
  }

  const resolvedName = await ensureUniqueFolderName(
    folder.parentFolderId,
    name,
    folder.id,
  );

  await db
    .update(folders)
    .set({
      name: resolvedName,
      updatedAt: new Date(),
    })
    .where(eq(folders.id, folder.id));

  await logAuditEvent({
    actorUserId: session.user.id,
    actorEmail: session.user.email,
    actionType: "folder.renamed",
    resourceType: "folder",
    resourceId: folder.id,
    metadataJson: {
      name: resolvedName,
    },
  });

  revalidateWorkspace();
}

export async function moveFolderAction(formData: FormData) {
  const session = await requireSession();
  const folderId = String(formData.get("folderId") ?? "");
  const targetFolderId = String(formData.get("targetFolderId") ?? "").trim() || null;

  if (!folderId) {
    return;
  }

  const folder = await getManagedFolder(folderId);

  if (!folder || folder.isDeleted) {
    return;
  }

  if (
    !canEditResource({
      userId: session.user.id,
      userRole: session.user.role,
      ownerUserId: folder.ownerUserId,
    })
  ) {
    return;
  }

  if (targetFolderId) {
    const descendantIds = await collectDescendantFolderIds(folderId);

    if (descendantIds.includes(targetFolderId)) {
      return;
    }

    const targetFolder = await getManagedFolder(targetFolderId);

    if (!targetFolder || targetFolder.isDeleted) {
      return;
    }

    if (
      !canEditResource({
        userId: session.user.id,
        userRole: session.user.role,
        ownerUserId: targetFolder.ownerUserId,
      })
    ) {
      return;
    }
  }

  await db
    .update(folders)
    .set({
      parentFolderId: targetFolderId,
      updatedAt: new Date(),
    })
    .where(eq(folders.id, folder.id));

  await logAuditEvent({
    actorUserId: session.user.id,
    actorEmail: session.user.email,
    actionType: "folder.moved",
    resourceType: "folder",
    resourceId: folder.id,
    metadataJson: {
      targetFolderId,
    },
  });

  revalidateWorkspace();
}

export async function updateFolderVisibilityAction(formData: FormData) {
  const session = await requireSession();
  const folderId = String(formData.get("folderId") ?? "");
  const visibility = getVisibilityValue(formData.get("visibility"));

  if (!folderId || !RESOURCE_VISIBILITY_VALUES.includes(visibility)) {
    return;
  }

  const folder = await getManagedFolder(folderId);

  if (!folder || folder.isDeleted) {
    return;
  }

  if (
    !canEditResource({
      userId: session.user.id,
      userRole: session.user.role,
      ownerUserId: folder.ownerUserId,
    })
  ) {
    return;
  }

  await db
    .update(folders)
    .set({
      visibility,
      updatedAt: new Date(),
    })
    .where(eq(folders.id, folder.id));

  await logAuditEvent({
    actorUserId: session.user.id,
    actorEmail: session.user.email,
    actionType: "permission.changed",
    resourceType: "folder",
    resourceId: folder.id,
    metadataJson: {
      visibility,
    },
  });

  revalidateWorkspace();
}

export async function renameFileAction(formData: FormData) {
  const session = await requireSession();
  const fileId = String(formData.get("fileId") ?? "");
  const name = String(formData.get("name") ?? "").trim();

  if (!fileId || !name) {
    return;
  }

  const file = await getFileRecord(fileId);

  if (!file || file.isDeleted) {
    return;
  }

  if (
    !canEditResource({
      userId: session.user.id,
      userRole: session.user.role,
      ownerUserId: file.ownerUserId,
    })
  ) {
    return;
  }

  const resolvedName = await ensureUniqueFileName(file.folderId, name, file.id);

  await db
    .update(files)
    .set({
      displayName: resolvedName,
      updatedAt: new Date(),
    })
    .where(eq(files.id, file.id));

  await logAuditEvent({
    actorUserId: session.user.id,
    actorEmail: session.user.email,
    actionType: "file.renamed",
    resourceType: "file",
    resourceId: file.id,
    metadataJson: {
      displayName: resolvedName,
    },
  });

  revalidateWorkspace();
}

export async function moveFileAction(formData: FormData) {
  const session = await requireSession();
  const fileId = String(formData.get("fileId") ?? "");
  const targetFolderId = String(formData.get("targetFolderId") ?? "").trim() || null;

  if (!fileId) {
    return;
  }

  const file = await getFileRecord(fileId);

  if (!file || file.isDeleted) {
    return;
  }

  if (
    !canEditResource({
      userId: session.user.id,
      userRole: session.user.role,
      ownerUserId: file.ownerUserId,
    })
  ) {
    return;
  }

  if (targetFolderId) {
    const targetFolder = await getManagedFolder(targetFolderId);

    if (!targetFolder || targetFolder.isDeleted) {
      return;
    }

    if (
      !canEditResource({
        userId: session.user.id,
        userRole: session.user.role,
        ownerUserId: targetFolder.ownerUserId,
      })
    ) {
      return;
    }
  }

  const resolvedName = await ensureUniqueFileName(targetFolderId, file.displayName, file.id);

  await db
    .update(files)
    .set({
      folderId: targetFolderId,
      displayName: resolvedName,
      updatedAt: new Date(),
    })
    .where(eq(files.id, file.id));

  await logAuditEvent({
    actorUserId: session.user.id,
    actorEmail: session.user.email,
    actionType: "file.moved",
    resourceType: "file",
    resourceId: file.id,
    metadataJson: {
      targetFolderId,
      displayName: resolvedName,
    },
  });

  revalidateWorkspace();
}

export async function updateFileVisibilityAction(formData: FormData) {
  const session = await requireSession();
  const fileId = String(formData.get("fileId") ?? "");
  const visibility = getVisibilityValue(formData.get("visibility"));

  if (!fileId || !RESOURCE_VISIBILITY_VALUES.includes(visibility)) {
    return;
  }

  const file = await getFileRecord(fileId);

  if (!file || file.isDeleted) {
    return;
  }

  if (
    !canEditResource({
      userId: session.user.id,
      userRole: session.user.role,
      ownerUserId: file.ownerUserId,
    })
  ) {
    return;
  }

  await db
    .update(files)
    .set({
      visibility,
      updatedAt: new Date(),
    })
    .where(eq(files.id, file.id));

  await logAuditEvent({
    actorUserId: session.user.id,
    actorEmail: session.user.email,
    actionType: "permission.changed",
    resourceType: "file",
    resourceId: file.id,
    metadataJson: {
      visibility,
    },
  });

  revalidateWorkspace();
}

export async function softDeleteFileAction(formData: FormData) {
  const session = await requireSession();
  const fileId = String(formData.get("fileId") ?? "");
  const file = await getFileRecord(fileId);

  if (!file || file.isDeleted) {
    return;
  }

  if (
    !canDeleteResource({
      userId: session.user.id,
      userRole: session.user.role,
      ownerUserId: file.ownerUserId,
    })
  ) {
    return;
  }

  await db
    .update(files)
    .set({
      status: "deleted",
      isDeleted: true,
      deletedAt: new Date(),
      updatedAt: new Date(),
    })
    .where(eq(files.id, fileId));

  await logAuditEvent({
    actorUserId: session.user.id,
    actorEmail: session.user.email,
    actionType: "file.deleted",
    resourceType: "file",
    resourceId: fileId,
  });

  revalidateWorkspace();
}

export async function softDeleteFolderAction(formData: FormData) {
  const session = await requireSession();
  const folderId = String(formData.get("folderId") ?? "");
  const folder = await getManagedFolder(folderId);

  if (!folder || folder.isDeleted) {
    return;
  }

  if (
    !canDeleteResource({
      userId: session.user.id,
      userRole: session.user.role,
      ownerUserId: folder.ownerUserId,
    })
  ) {
    return;
  }

  const descendantFolderIds = await collectDescendantFolderIds(folderId);

  await db
    .update(folders)
    .set({
      isDeleted: true,
      deletedAt: new Date(),
      updatedAt: new Date(),
    })
    .where(inArray(folders.id, descendantFolderIds));

  await db
    .update(files)
    .set({
      status: "deleted",
      isDeleted: true,
      deletedAt: new Date(),
      updatedAt: new Date(),
    })
    .where(inArray(files.folderId, descendantFolderIds));

  await logAuditEvent({
    actorUserId: session.user.id,
    actorEmail: session.user.email,
    actionType: "folder.deleted",
    resourceType: "folder",
    resourceId: folderId,
    metadataJson: {
      descendantCount: descendantFolderIds.length,
    },
  });

  revalidateWorkspace();
}

export async function restoreResourceAction(formData: FormData) {
  const session = await requireSession();
  const resourceType = String(formData.get("resourceType") ?? "");
  const resourceId = String(formData.get("resourceId") ?? "");
  const settings = await getAppSettings();

  if (resourceType === "file") {
    const file = await getFileRecord(resourceId);

    if (!file || !file.isDeleted) {
      return;
    }

    if (
      !canEditResource({
        userId: session.user.id,
        userRole: session.user.role,
        ownerUserId: file.ownerUserId,
      })
    ) {
      return;
    }

    if (
      !canManageAdmin(session.user.role) &&
      !isWithinRetentionWindow(file.deletedAt ?? null, settings.defaultSoftDeleteRetentionDays)
    ) {
      return;
    }

    await db
      .update(files)
      .set({
        status: "ready",
        isDeleted: false,
        deletedAt: null,
        updatedAt: new Date(),
      })
      .where(eq(files.id, resourceId));
  } else if (resourceType === "folder") {
    const folder = await getManagedFolder(resourceId);

    if (!folder || !folder.isDeleted) {
      return;
    }

    if (
      !canEditResource({
        userId: session.user.id,
        userRole: session.user.role,
        ownerUserId: folder.ownerUserId,
      })
    ) {
      return;
    }

    if (
      !canManageAdmin(session.user.role) &&
      !isWithinRetentionWindow(folder.deletedAt ?? null, settings.defaultSoftDeleteRetentionDays)
    ) {
      return;
    }

    const descendantFolderIds = await collectDescendantFolderIds(resourceId);

    await db
      .update(folders)
      .set({
        isDeleted: false,
        deletedAt: null,
        updatedAt: new Date(),
      })
      .where(inArray(folders.id, descendantFolderIds));

    await db
      .update(files)
      .set({
        status: "ready",
        isDeleted: false,
        deletedAt: null,
        updatedAt: new Date(),
      })
      .where(inArray(files.folderId, descendantFolderIds));
  } else {
    return;
  }

  await logAuditEvent({
    actorUserId: session.user.id,
    actorEmail: session.user.email,
    actionType: `${resourceType}.restored`,
    resourceType,
    resourceId,
  });

  revalidateWorkspace();
}

export async function hardDeleteResourceAction(formData: FormData) {
  const session = await requireAdminSession();
  const resourceType = String(formData.get("resourceType") ?? "");
  const resourceId = String(formData.get("resourceId") ?? "");

  if (!resourceId || !ADMIN_ROLES.has(session.user.role ?? "")) {
    return;
  }

  if (resourceType === "file") {
    const file = await getFileRecord(resourceId);

    if (!file || !file.isDeleted) {
      return;
    }

    const versions = await db
      .select({
        storageKey: fileVersions.storageKey,
      })
      .from(fileVersions)
      .where(eq(fileVersions.fileId, resourceId));

    await Promise.allSettled(
      versions.map((version) => deleteStoredObject(version.storageKey)),
    );

    await db
      .delete(shareLinks)
      .where(and(eq(shareLinks.resourceType, "file"), eq(shareLinks.resourceId, resourceId)));

    await db.delete(files).where(eq(files.id, resourceId));
  } else if (resourceType === "folder") {
    const folder = await getManagedFolder(resourceId);

    if (!folder || !folder.isDeleted) {
      return;
    }

    const descendantFolderIds = await collectDescendantFolderIds(resourceId);
    const fileRows = await db
      .select({
        id: files.id,
      })
      .from(files)
      .where(inArray(files.folderId, descendantFolderIds));

    const fileIds = fileRows.map((row) => row.id);

    if (fileIds.length > 0) {
      const versions = await db
        .select({
          storageKey: fileVersions.storageKey,
        })
        .from(fileVersions)
        .where(inArray(fileVersions.fileId, fileIds));

      await Promise.allSettled(
        versions.map((version) => deleteStoredObject(version.storageKey)),
      );

      await db
        .delete(shareLinks)
        .where(
          and(eq(shareLinks.resourceType, "file"), inArray(shareLinks.resourceId, fileIds)),
        );

      await db.delete(files).where(inArray(files.id, fileIds));
    }

    await db.delete(folders).where(inArray(folders.id, descendantFolderIds));
  } else {
    return;
  }

  await logAuditEvent({
    actorUserId: session.user.id,
    actorEmail: session.user.email,
    actionType: `${resourceType}.hard_deleted`,
    resourceType,
    resourceId,
  });

  revalidateWorkspace();
}

export async function createShareLinkAction(
  _prevState: { error?: string; success?: boolean; url?: string; notice?: string },
  formData: FormData,
) {
  const session = await requireSession();
  const settings = await getAppSettings();
  const fileId = String(formData.get("fileId") ?? "");
  const mode = String(formData.get("mode") ?? "view") === "download" ? "download" : "view";
  const notifyEmail = String(formData.get("notifyEmail") ?? "").trim().toLowerCase();
  const expiryDaysRaw = String(formData.get("expiryDays") ?? settings.defaultShareExpiryDays);
  const expiryDays = Math.max(
    1,
    Math.min(90, Number(expiryDaysRaw) || settings.defaultShareExpiryDays),
  );

  const file = await getFileRecord(fileId);
  if (!file || file.isDeleted || file.status !== "ready") {
    return { error: "File not available for sharing." };
  }

  if (
    !canShareResource({
      userId: session.user.id,
      userRole: session.user.role,
      ownerUserId: file.ownerUserId,
    })
  ) {
    return { error: "You cannot share this file." };
  }

  const token = createShareToken();
  const shareId = createId("share");
  const expiresAt = new Date(Date.now() + expiryDays * 24 * 60 * 60 * 1000);
  const url = `${env.appBaseUrl}/s/${token}`;

  await db.insert(shareLinks).values({
    id: shareId,
    resourceType: "file",
    resourceId: fileId,
    tokenHash: hashValue(token),
    createdByUserId: session.user.id,
    mode,
    expiresAt,
  });

  let notice: string | undefined;

  if (notifyEmail) {
    try {
      await sendShareLinkEmail({
        to: notifyEmail,
        fileName: file.displayName,
        shareUrl: url,
        expiresAt,
        senderName: session.user.name,
        mode,
      });
      notice = `Share email sent to ${notifyEmail}.`;
    } catch {
      notice = "Share link created, but the email notification could not be delivered.";
    }
  }

  await logAuditEvent({
    actorUserId: session.user.id,
    actorEmail: session.user.email,
    actionType: "share.created",
    resourceType: "share_link",
    resourceId: shareId,
    metadataJson: {
      fileId,
      mode,
      expiresAt,
      notifyEmail: notifyEmail || null,
    },
  });

  revalidateWorkspace();
  return {
    success: true,
    url,
    notice,
  };
}

export async function revokeShareLinkAction(formData: FormData) {
  const session = await requireSession();
  const shareId = String(formData.get("shareId") ?? "");

  const [share] = await db
    .select()
    .from(shareLinks)
    .where(eq(shareLinks.id, shareId))
    .limit(1);

  if (!share) {
    return;
  }

  if (share.createdByUserId !== session.user.id && !canManageAdmin(session.user.role)) {
    return;
  }

  await db
    .update(shareLinks)
    .set({
      isRevoked: true,
      updatedAt: new Date(),
    })
    .where(eq(shareLinks.id, shareId));

  await logAuditEvent({
    actorUserId: session.user.id,
    actorEmail: session.user.email,
    actionType: "share.revoked",
    resourceType: "share_link",
    resourceId: shareId,
  });

  revalidateWorkspace();
}
