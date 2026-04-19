"use server";

import { eq, inArray } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { requireSession } from "@/lib/auth/session";
import { db } from "@/lib/db/client";
import { files, folders, shareLinks } from "@/lib/db/schema";
import { canAccessResource, canManageAdmin, getFileRecord } from "@/lib/drive";
import { env } from "@/lib/env";
import { createId, createShareToken, hashValue } from "@/lib/ids";
import { logAuditEvent } from "@/lib/audit";

async function collectDescendantFolderIds(rootFolderId: string) {
  const allIds = [rootFolderId];
  const queue = [rootFolderId];

  while (queue.length > 0) {
    const current = queue.shift()!;
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

export async function createFolderAction(formData: FormData) {
  const session = await requireSession();
  const name = String(formData.get("name") ?? "").trim();
  const parentFolderId = String(formData.get("parentFolderId") ?? "").trim() || null;

  if (!name) {
    return;
  }

  if (parentFolderId) {
    const [parent] = await db
      .select({
        id: folders.id,
        ownerUserId: folders.ownerUserId,
        visibility: folders.visibility,
        isDeleted: folders.isDeleted,
      })
      .from(folders)
      .where(eq(folders.id, parentFolderId))
      .limit(1);

    if (!parent || parent.isDeleted) {
      return;
    }

    if (
      !canAccessResource({
        userId: session.user.id,
        userRole: session.user.role,
        ownerUserId: parent.ownerUserId,
        visibility: parent.visibility,
      })
    ) {
      return;
    }
  }

  const folderId = createId("folder");

  await db.insert(folders).values({
    id: folderId,
    parentFolderId,
    name,
    ownerUserId: session.user.id,
    createdByUserId: session.user.id,
    visibility: "private",
  });

  await logAuditEvent({
    actorUserId: session.user.id,
    actorEmail: session.user.email,
    actionType: "folder.created",
    resourceType: "folder",
    resourceId: folderId,
    metadataJson: {
      name,
      parentFolderId,
    },
  });

  revalidatePath("/files");
  revalidatePath("/dashboard");
}

export async function softDeleteFileAction(formData: FormData) {
  const session = await requireSession();
  const fileId = String(formData.get("fileId") ?? "");
  const file = await getFileRecord(fileId);

  if (!file || file.isDeleted) {
    return;
  }

  if (
    !canAccessResource({
      userId: session.user.id,
      userRole: session.user.role,
      ownerUserId: file.ownerUserId,
      visibility: file.visibility,
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

  revalidatePath("/files");
  revalidatePath("/deleted");
  revalidatePath("/dashboard");
}

export async function softDeleteFolderAction(formData: FormData) {
  const session = await requireSession();
  const folderId = String(formData.get("folderId") ?? "");

  const [folder] = await db
    .select({
      id: folders.id,
      ownerUserId: folders.ownerUserId,
      visibility: folders.visibility,
      isDeleted: folders.isDeleted,
    })
    .from(folders)
    .where(eq(folders.id, folderId))
    .limit(1);

  if (!folder || folder.isDeleted) {
    return;
  }

  if (
    !canAccessResource({
      userId: session.user.id,
      userRole: session.user.role,
      ownerUserId: folder.ownerUserId,
      visibility: folder.visibility,
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

  revalidatePath("/files");
  revalidatePath("/deleted");
  revalidatePath("/dashboard");
}

export async function restoreResourceAction(formData: FormData) {
  const session = await requireSession();
  const resourceType = String(formData.get("resourceType") ?? "");
  const resourceId = String(formData.get("resourceId") ?? "");

  if (resourceType === "file") {
    const file = await getFileRecord(resourceId);

    if (!file || !file.isDeleted) {
      return;
    }

    if (
      !canAccessResource({
        userId: session.user.id,
        userRole: session.user.role,
        ownerUserId: file.ownerUserId,
        visibility: file.visibility,
      })
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
    const [folder] = await db
      .select({
        id: folders.id,
        ownerUserId: folders.ownerUserId,
        visibility: folders.visibility,
        isDeleted: folders.isDeleted,
      })
      .from(folders)
      .where(eq(folders.id, resourceId))
      .limit(1);

    if (!folder || !folder.isDeleted) {
      return;
    }

    if (
      !canAccessResource({
        userId: session.user.id,
        userRole: session.user.role,
        ownerUserId: folder.ownerUserId,
        visibility: folder.visibility,
      })
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

  revalidatePath("/files");
  revalidatePath("/deleted");
  revalidatePath("/dashboard");
}

export async function createShareLinkAction(
  _prevState: { error?: string; success?: boolean; url?: string },
  formData: FormData,
) {
  const session = await requireSession();
  const fileId = String(formData.get("fileId") ?? "");
  const mode = String(formData.get("mode") ?? "view") === "download" ? "download" : "view";
  const expiryDaysRaw = String(formData.get("expiryDays") ?? "7");
  const expiryDays = Math.max(1, Math.min(30, Number(expiryDaysRaw) || 7));

  const file = await getFileRecord(fileId);
  if (!file || file.isDeleted || file.status !== "ready") {
    return { error: "File not available for sharing." };
  }

  if (
    !canAccessResource({
      userId: session.user.id,
      userRole: session.user.role,
      ownerUserId: file.ownerUserId,
      visibility: file.visibility,
    })
  ) {
    return { error: "You cannot share this file." };
  }

  const token = createShareToken();
  const shareId = createId("share");
  const expiresAt = new Date(Date.now() + expiryDays * 24 * 60 * 60 * 1000);

  await db.insert(shareLinks).values({
    id: shareId,
    resourceType: "file",
    resourceId: fileId,
    tokenHash: hashValue(token),
    createdByUserId: session.user.id,
    mode,
    expiresAt,
  });

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
    },
  });

  revalidatePath("/shared");
  revalidatePath("/files");
  return {
    success: true,
    url: `${env.appBaseUrl}/s/${token}`,
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

  revalidatePath("/shared");
}
