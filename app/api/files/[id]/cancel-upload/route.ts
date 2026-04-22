import { and, desc, eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { z } from "zod";
import { logAuditEvent } from "@/lib/audit";
import { requireSession } from "@/lib/auth/session";
import { db } from "@/lib/db/client";
import { files, uploads } from "@/lib/db/schema";
import { canEditResource, getFileRecord } from "@/lib/drive";
import { abortMultipartUpload } from "@/lib/storage";

const cancelUploadSchema = z
  .object({
    multipartUploadId: z.string().min(1).optional(),
  })
  .optional();

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await requireSession();
  const { id } = await params;
  const body = cancelUploadSchema.parse(await request.json().catch(() => undefined));
  const file = await getFileRecord(id);

  if (!file) {
    return NextResponse.json({ error: "File not found." }, { status: 404 });
  }

  if (
    !canEditResource({
      userId: session.user.id,
      userRole: session.user.role,
      ownerUserId: file.ownerUserId,
    })
  ) {
    return NextResponse.json({ error: "Forbidden." }, { status: 403 });
  }

  const [upload] = await db
    .select()
    .from(uploads)
    .where(and(eq(uploads.fileId, file.id), eq(uploads.uploadStatus, "initiated")))
    .orderBy(desc(uploads.createdAt))
    .limit(1);

  if (!upload) {
    return NextResponse.json({ ok: true });
  }

  const multipartUploadId = body?.multipartUploadId ?? upload.providerUploadId;

  if (multipartUploadId) {
    await abortMultipartUpload({
      storageKey: upload.storageKey,
      uploadId: multipartUploadId,
    }).catch(() => undefined);
  }

  await db
    .update(uploads)
    .set({
      uploadStatus: "cancelled",
      updatedAt: new Date(),
    })
    .where(eq(uploads.id, upload.id));

  await db
    .update(files)
    .set({
      status: "failed",
      isDeleted: true,
      deletedAt: new Date(),
      updatedAt: new Date(),
    })
    .where(eq(files.id, file.id));

  await logAuditEvent({
    actorUserId: session.user.id,
    actorEmail: session.user.email,
    actionType: "file.upload.cancelled",
    resourceType: "file",
    resourceId: file.id,
    metadataJson: {
      uploadId: upload.id,
      uploadStrategy: multipartUploadId ? "multipart" : "single",
    },
  });

  return NextResponse.json({ ok: true });
}
