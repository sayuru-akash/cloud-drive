"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { logAuditEvent } from "@/lib/audit";
import { requireAdminSession } from "@/lib/auth/session";
import { db } from "@/lib/db/client";
import { users } from "@/lib/db/schema";

const allowedRoles = new Set(["member", "admin", "super_admin"]);

export async function updateUserRoleAction(formData: FormData) {
  const session = await requireAdminSession();
  const userId = String(formData.get("userId") ?? "");
  const role = String(formData.get("role") ?? "");

  if (!allowedRoles.has(role)) {
    return;
  }

  await db
    .update(users)
    .set({
      role,
      updatedAt: new Date(),
    })
    .where(eq(users.id, userId));

  await logAuditEvent({
    actorUserId: session.user.id,
    actorEmail: session.user.email,
    actionType: "user.role.updated",
    resourceType: "user",
    resourceId: userId,
    metadataJson: { role },
  });

  revalidatePath("/admin");
}
