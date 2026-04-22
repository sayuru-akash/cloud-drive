import { and, desc, eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { z } from "zod";
import { requireSession } from "@/lib/auth/session";
import { db } from "@/lib/db/client";
import { uploads } from "@/lib/db/schema";
import { canEditResource, getFileRecord } from "@/lib/drive";
import { createMultipartPartUploadUrl } from "@/lib/storage";

const multipartPartSchema = z.object({
  multipartUploadId: z.string().min(1),
  partNumber: z.number().int().positive().max(10000),
});

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await requireSession();
  const { id } = await params;
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

  const body = multipartPartSchema.parse(await request.json());

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

  const uploadUrl = await createMultipartPartUploadUrl({
    storageKey: upload.storageKey,
    uploadId: body.multipartUploadId,
    partNumber: body.partNumber,
  });

  return NextResponse.json({
    uploadUrl,
    partNumber: body.partNumber,
  });
}
