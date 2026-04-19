import { NextResponse } from "next/server";
import { and, desc, eq } from "drizzle-orm";
import { logAuditEvent } from "@/lib/audit";
import { requireSession } from "@/lib/auth/session";
import { db } from "@/lib/db/client";
import { fileVersions, files, uploads } from "@/lib/db/schema";
import { canAccessResource, getFileRecord } from "@/lib/drive";
import { env } from "@/lib/env";
import { createId } from "@/lib/ids";
import { getStoredObject } from "@/lib/storage";

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await requireSession();
  const { id } = await params;

  const file = await getFileRecord(id);
  if (!file) {
    return NextResponse.json({ error: "File not found." }, { status: 404 });
  }

  const canAccess = canAccessResource({
    userId: session.user.id,
    userRole: session.user.role,
    ownerUserId: file.ownerUserId,
    visibility: file.visibility,
  });

  if (!canAccess) {
    return NextResponse.json({ error: "Forbidden." }, { status: 403 });
  }

  const [upload] = await db
    .select()
    .from(uploads)
    .where(and(eq(uploads.fileId, file.id), eq(uploads.uploadStatus, "initiated")))
    .orderBy(desc(uploads.createdAt))
    .limit(1);

  if (!upload) {
    return NextResponse.json(
      { error: "No pending upload found for this file." },
      { status: 400 },
    );
  }

  const object = await getStoredObject(upload.storageKey);
  const sizeBytes = Number(object.ContentLength ?? upload.sizeBytes);
  const mimeType = object.ContentType ?? upload.contentType;
  const versionId = createId("ver");

  await db.insert(fileVersions).values({
    id: versionId,
    fileId: file.id,
    versionNumber: 1,
    storageBucket: env.b2BucketName,
    storageKey: upload.storageKey,
    sizeBytes,
    mimeType,
    uploadedByUserId: session.user.id,
  });

  await db
    .update(files)
    .set({
      status: "ready",
      sizeBytes,
      mimeType,
      currentVersionId: versionId,
      updatedAt: new Date(),
    })
    .where(eq(files.id, file.id));

  await db
    .update(uploads)
    .set({
      uploadStatus: "completed",
      completedAt: new Date(),
      updatedAt: new Date(),
    })
    .where(eq(uploads.id, upload.id));

  await logAuditEvent({
    actorUserId: session.user.id,
    actorEmail: session.user.email,
    actionType: "file.upload.completed",
    resourceType: "file",
    resourceId: file.id,
    metadataJson: {
      uploadId: upload.id,
      versionId,
      sizeBytes,
      mimeType,
    },
  });

  return NextResponse.json({
    ok: true,
    fileId: file.id,
    versionId,
  });
}
