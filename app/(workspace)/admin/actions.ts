"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { normalizeBlockedExtensions, setAppSettings } from "@/lib/app-settings";
import { logAuditEvent } from "@/lib/audit";
import { requireAdminSession } from "@/lib/auth/session";
import { db } from "@/lib/db/client";
import { users } from "@/lib/db/schema";

const allowedRoles = new Set(["member", "admin", "super_admin"]);

const settingsFormSchema = z.object({
  maxUploadSizeBytes: z.coerce.number().int().positive(),
  defaultSoftDeleteRetentionDays: z.coerce.number().int().min(1).max(365),
  blockedFileExtensions: z.string().default(""),
  defaultShareExpiryDays: z.coerce.number().int().min(1).max(90),
});

function revalidateAdminSurfaces() {
  for (const path of ["/admin", "/settings", "/files", "/deleted"]) {
    revalidatePath(path);
  }
}

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

  revalidateAdminSurfaces();
}

export async function updateUserStatusAction(formData: FormData) {
  const session = await requireAdminSession();
  const userId = String(formData.get("userId") ?? "");
  const isActive = String(formData.get("isActive") ?? "true") === "true";

  if (!userId || userId === session.user.id) {
    return;
  }

  await db
    .update(users)
    .set({
      isActive,
      updatedAt: new Date(),
    })
    .where(eq(users.id, userId));

  await logAuditEvent({
    actorUserId: session.user.id,
    actorEmail: session.user.email,
    actionType: "user.status.updated",
    resourceType: "user",
    resourceId: userId,
    metadataJson: { isActive },
  });

  revalidateAdminSurfaces();
}

export async function updateAppSettingsAction(formData: FormData) {
  const session = await requireAdminSession();
  const parsed = settingsFormSchema.parse({
    maxUploadSizeBytes: formData.get("maxUploadSizeBytes"),
    defaultSoftDeleteRetentionDays: formData.get("defaultSoftDeleteRetentionDays"),
    blockedFileExtensions: formData.get("blockedFileExtensions"),
    defaultShareExpiryDays: formData.get("defaultShareExpiryDays"),
  });

  await setAppSettings(
    {
      maxUploadSizeBytes: parsed.maxUploadSizeBytes,
      defaultSoftDeleteRetentionDays: parsed.defaultSoftDeleteRetentionDays,
      blockedFileExtensions: normalizeBlockedExtensions(parsed.blockedFileExtensions),
      defaultShareExpiryDays: parsed.defaultShareExpiryDays,
    },
    session.user.id,
  );

  await logAuditEvent({
    actorUserId: session.user.id,
    actorEmail: session.user.email,
    actionType: "settings.updated",
    resourceType: "app_settings",
    metadataJson: {
      maxUploadSizeBytes: parsed.maxUploadSizeBytes,
      defaultSoftDeleteRetentionDays: parsed.defaultSoftDeleteRetentionDays,
      defaultShareExpiryDays: parsed.defaultShareExpiryDays,
    },
  });

  revalidateAdminSurfaces();
}
