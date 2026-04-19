import "server-only";
import { headers } from "next/headers";
import { db } from "@/lib/db/client";
import { auditLogs } from "@/lib/db/schema";
import { createId } from "@/lib/ids";

type LogAuditEventInput = {
  actorUserId?: string | null;
  actorEmail?: string | null;
  actionType: string;
  resourceType?: string | null;
  resourceId?: string | null;
  metadataJson?: Record<string, unknown>;
};

export async function logAuditEvent(input: LogAuditEventInput) {
  const requestHeaders = await headers();

  const forwardedFor = requestHeaders.get("x-forwarded-for");
  const ipAddress = forwardedFor?.split(",")[0]?.trim() ?? null;
  const userAgent = requestHeaders.get("user-agent");

  await db.insert(auditLogs).values({
    id: createId("audit"),
    actorUserId: input.actorUserId ?? null,
    actorEmail: input.actorEmail ?? null,
    actionType: input.actionType,
    resourceType: input.resourceType ?? null,
    resourceId: input.resourceId ?? null,
    ipAddress,
    userAgent,
    metadataJson: input.metadataJson ?? {},
  });
}
