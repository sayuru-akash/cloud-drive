import { NextResponse } from "next/server";
import { logAuditEvent } from "@/lib/audit";
import { getActivePublicShareByToken } from "@/lib/shares";
import { getStoredObjectStream } from "@/lib/storage";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ token: string }> },
) {
  const { token } = await params;
  const share = await getActivePublicShareByToken(token);

  if (!share || !share.previewable) {
    return NextResponse.json({ error: "Preview unavailable." }, { status: 404 });
  }

  const object = await getStoredObjectStream(share.version.storageKey);
  const body = object.Body?.transformToWebStream();

  if (!body) {
    return NextResponse.json({ error: "Preview stream unavailable." }, { status: 404 });
  }

  await logAuditEvent({
    actionType: "file.previewed",
    resourceType: "share_link",
    resourceId: share.id,
    metadataJson: {
      fileId: share.fileId,
      mode: share.mode,
      publicAccess: true,
    },
  });

  return new Response(body, {
    headers: {
      "Content-Type": object.ContentType ?? share.mimeType ?? "application/octet-stream",
      "Content-Length": String(object.ContentLength ?? share.version.sizeBytes),
      "Cache-Control": "private, max-age=60",
      "Content-Disposition": "inline",
    },
  });
}
