import "server-only";
import { and, eq, gt, isNull, or } from "drizzle-orm";
import { db } from "@/lib/db/client";
import { files, shareLinks } from "@/lib/db/schema";
import { getCurrentFileVersion } from "@/lib/drive";
import { hashValue } from "@/lib/ids";

export function isPreviewableMimeType(mimeType: string | null | undefined) {
  return Boolean(
    mimeType &&
      (mimeType.startsWith("image/") || mimeType === "application/pdf"),
  );
}

export async function getActivePublicShareByToken(token: string) {
  const tokenHash = hashValue(token);

  const [share] = await db
    .select({
      id: shareLinks.id,
      fileId: shareLinks.resourceId,
      mode: shareLinks.mode,
      expiresAt: shareLinks.expiresAt,
      isRevoked: shareLinks.isRevoked,
      fileName: files.displayName,
      mimeType: files.mimeType,
      isDeleted: files.isDeleted,
      status: files.status,
    })
    .from(shareLinks)
    .leftJoin(files, eq(shareLinks.resourceId, files.id))
    .where(
      and(
        eq(shareLinks.tokenHash, tokenHash),
        eq(shareLinks.resourceType, "file"),
        eq(shareLinks.isRevoked, false),
        or(isNull(shareLinks.expiresAt), gt(shareLinks.expiresAt, new Date())),
      ),
    )
    .limit(1);

  if (!share || !share.fileId || share.isDeleted || share.status !== "ready") {
    return null;
  }

  const version = await getCurrentFileVersion(share.fileId);

  if (!version) {
    return null;
  }

  return {
    ...share,
    version,
    previewable: isPreviewableMimeType(share.mimeType),
  };
}
