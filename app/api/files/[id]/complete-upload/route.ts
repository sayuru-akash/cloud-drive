import { NextResponse } from "next/server";
import { and, desc, eq } from "drizzle-orm";
import { z } from "zod";
import { logAuditEvent } from "@/lib/audit";
import { requireSession } from "@/lib/auth/session";
import { db } from "@/lib/db/client";
import { fileVersions, files, uploads } from "@/lib/db/schema";
import { canEditResource, getFileRecord } from "@/lib/drive";
import { env } from "@/lib/env";
import { createId } from "@/lib/ids";
import { completeMultipartUpload, getStoredObject } from "@/lib/storage";

const completeUploadSchema = z
  .object({
    uploadStrategy: z.enum(["single", "multipart"]).optional(),
    multipartUploadId: z.string().min(1).optional(),
    parts: z
      .array(
        z.object({
          partNumber: z.number().int().positive(),
          etag: z.string().min(1),
        }),
      )
      .min(1)
      .optional(),
  })
  .optional();

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await requireSession();
  const { id } = await params;
  const body = completeUploadSchema.parse(await request.json().catch(() => undefined));

  const file = await getFileRecord(id);
  if (!file) {
    return NextResponse.json({ error: "File not found." }, { status: 404 });
  }

  const canAccess = canEditResource({
    userId: session.user.id,
    userRole: session.user.role,
    ownerUserId: file.ownerUserId,
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

  if (body?.uploadStrategy === "multipart") {
    const multipartUploadId = body.multipartUploadId ?? upload.providerUploadId;

    if (!multipartUploadId || !body.parts?.length) {
      return NextResponse.json(
        { error: "Multipart upload is missing completion data." },
        { status: 400 },
      );
    }

    try {
      await completeMultipartUpload({
        storageKey: upload.storageKey,
        uploadId: multipartUploadId,
        parts: body.parts,
      });
    } catch {
      return NextResponse.json(
        { error: "Multipart upload could not be finalized." },
        { status: 400 },
      );
    }
  }

  let object;

  try {
    object = await getStoredObject(upload.storageKey);
  } catch {
    await db
      .update(uploads)
      .set({
        uploadStatus: "failed",
        updatedAt: new Date(),
      })
      .where(eq(uploads.id, upload.id));

    await db
      .update(files)
      .set({
        status: "failed",
        updatedAt: new Date(),
      })
      .where(eq(files.id, file.id));

    return NextResponse.json(
      { error: "Uploaded object could not be verified." },
      { status: 400 },
    );
  }
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
      uploadStrategy: body?.uploadStrategy ?? "single",
    },
  });

  return NextResponse.json({
    ok: true,
    fileId: file.id,
    versionId,
  });
}
