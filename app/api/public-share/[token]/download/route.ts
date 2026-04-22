import { NextResponse } from "next/server";
import { logAuditEvent } from "@/lib/audit";
import { getActivePublicShareByToken } from "@/lib/shares";
import { createDownloadUrlWithOptions } from "@/lib/storage";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ token: string }> },
) {
  const { token } = await params;
  const share = await getActivePublicShareByToken(token);

  if (!share || share.mode !== "download") {
    return NextResponse.json({ error: "Download unavailable." }, { status: 404 });
  }

  const url = await createDownloadUrlWithOptions(share.version.storageKey, {
    filename: share.fileName ?? "file",
  });

  await logAuditEvent({
    actionType: "file.downloaded",
    resourceType: "share_link",
    resourceId: share.id,
    metadataJson: {
      fileId: share.fileId,
      publicAccess: true,
    },
  });

  return NextResponse.redirect(url, 307);
}
