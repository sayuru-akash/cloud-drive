import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { logAuditEvent } from "@/lib/audit";
import { requireSession } from "@/lib/auth/session";
import { BLOCKED_FILE_EXTENSIONS } from "@/lib/constants";
import { db } from "@/lib/db/client";
import { files, folders, uploads } from "@/lib/db/schema";
import { canAccessResource } from "@/lib/drive";
import { env } from "@/lib/env";
import { createId } from "@/lib/ids";
import { buildStorageKey, createUploadUrl } from "@/lib/storage";

const initiateUploadSchema = z.object({
  folderId: z.string().nullable().optional(),
  fileName: z.string().min(1).max(255),
  contentType: z.string().min(1).max(255),
  sizeBytes: z.number().int().positive(),
});

export async function POST(request: Request) {
  const session = await requireSession();
  const body = initiateUploadSchema.parse(await request.json());

  const extension = body.fileName.split(".").pop()?.toLowerCase() ?? "";
  if (BLOCKED_FILE_EXTENSIONS.has(extension)) {
    return NextResponse.json(
      { error: "This file type is blocked by policy." },
      { status: 400 },
    );
  }

  if (body.sizeBytes > env.maxUploadSizeBytes) {
    return NextResponse.json(
      { error: "File exceeds the configured upload limit." },
      { status: 400 },
    );
  }

  if (body.folderId) {
    const [folder] = await db
      .select({
        id: folders.id,
        ownerUserId: folders.ownerUserId,
        visibility: folders.visibility,
        isDeleted: folders.isDeleted,
      })
      .from(folders)
      .where(eq(folders.id, body.folderId))
      .limit(1);

    if (!folder || folder.isDeleted) {
      return NextResponse.json({ error: "Target folder not found." }, { status: 404 });
    }

    const canAccess = canAccessResource({
      userId: session.user.id,
      userRole: session.user.role,
      ownerUserId: folder.ownerUserId,
      visibility: folder.visibility,
    });

    if (!canAccess) {
      return NextResponse.json({ error: "You cannot upload to this folder." }, { status: 403 });
    }
  }

  const fileId = createId("file");
  const uploadId = createId("upload");
  const storageKey = buildStorageKey(fileId, 1, body.fileName);
  const uploadUrl = await createUploadUrl({
    storageKey,
    contentType: body.contentType,
  });

  await db.insert(files).values({
    id: fileId,
    folderId: body.folderId ?? null,
    ownerUserId: session.user.id,
    createdByUserId: session.user.id,
    originalName: body.fileName,
    displayName: body.fileName,
    extension,
    mimeType: body.contentType,
    sizeBytes: body.sizeBytes,
    status: "pending",
    visibility: "private",
  });

  await db.insert(uploads).values({
    id: uploadId,
    fileId,
    initiatedByUserId: session.user.id,
    uploadStatus: "initiated",
    storageKey,
    contentType: body.contentType,
    sizeBytes: body.sizeBytes,
    expiresAt: new Date(Date.now() + 10 * 60 * 1000),
  });

  await logAuditEvent({
    actorUserId: session.user.id,
    actorEmail: session.user.email,
    actionType: "file.upload.created",
    resourceType: "file",
    resourceId: fileId,
    metadataJson: {
      uploadId,
      fileName: body.fileName,
      sizeBytes: body.sizeBytes,
    },
  });

  return NextResponse.json({
    fileId,
    uploadId,
    uploadUrl,
    method: "PUT",
  });
}
