import { NextResponse } from "next/server";
import { logAuditEvent } from "@/lib/audit";
import { requireSession } from "@/lib/auth/session";
import { canViewResource, getCurrentFileVersion, getFileRecord } from "@/lib/drive";
import { createDownloadUrlWithOptions } from "@/lib/storage";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await requireSession();
  const { id } = await params;

  const file = await getFileRecord(id);
  if (!file || file.status !== "ready" || file.isDeleted) {
    return NextResponse.json({ error: "File unavailable." }, { status: 404 });
  }

  const canAccess = canViewResource({
    userId: session.user.id,
    userRole: session.user.role,
    ownerUserId: file.ownerUserId,
    visibility: file.visibility,
  });

  if (!canAccess) {
    return NextResponse.json({ error: "Forbidden." }, { status: 403 });
  }

  const version = await getCurrentFileVersion(file.id);
  if (!version) {
    return NextResponse.json({ error: "File version missing." }, { status: 404 });
  }

  const url = await createDownloadUrlWithOptions(version.storageKey, {
    filename: file.displayName,
  });

  await logAuditEvent({
    actorUserId: session.user.id,
    actorEmail: session.user.email,
    actionType: "file.downloaded",
    resourceType: "file",
    resourceId: file.id,
    metadataJson: {
      versionId: version.id,
    },
  });

  return NextResponse.redirect(url, 307);
}
