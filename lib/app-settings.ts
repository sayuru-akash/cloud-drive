import "server-only";
import { inArray } from "drizzle-orm";
import { z } from "zod";
import { DEFAULT_BLOCKED_FILE_EXTENSIONS } from "@/lib/constants";
import { db } from "@/lib/db/client";
import { appSettings } from "@/lib/db/schema";
import { env } from "@/lib/env";

export const APP_SETTINGS_KEYS = [
  "maxUploadSizeBytes",
  "defaultSoftDeleteRetentionDays",
  "blockedFileExtensions",
  "defaultShareExpiryDays",
] as const;

export type AppSettingsKey = (typeof APP_SETTINGS_KEYS)[number];

export const appSettingsSchema = z.object({
  maxUploadSizeBytes: z.coerce.number().int().positive().max(5 * 1024 * 1024 * 1024),
  defaultSoftDeleteRetentionDays: z.coerce.number().int().min(1).max(365),
  blockedFileExtensions: z.array(z.string().min(1).max(20)).max(128),
  defaultShareExpiryDays: z.coerce.number().int().min(1).max(90),
});

export type AppSettings = z.infer<typeof appSettingsSchema>;

const defaultSettings: AppSettings = {
  maxUploadSizeBytes: env.maxUploadSizeBytes,
  defaultSoftDeleteRetentionDays: env.defaultSoftDeleteRetentionDays,
  blockedFileExtensions: DEFAULT_BLOCKED_FILE_EXTENSIONS,
  defaultShareExpiryDays: 7,
};

export function normalizeBlockedExtensions(raw: string) {
  return Array.from(
    new Set(
      raw
        .split(/[,\n]/)
        .map((value) => value.trim().toLowerCase().replace(/^\./, ""))
        .filter(Boolean),
    ),
  ).sort();
}

export async function getAppSettings(): Promise<AppSettings> {
  const rows = await db
    .select({
      key: appSettings.key,
      value: appSettings.value,
    })
    .from(appSettings)
    .where(inArray(appSettings.key, [...APP_SETTINGS_KEYS]));

  const merged: Record<string, unknown> = { ...defaultSettings };

  for (const row of rows) {
    merged[row.key] = row.value;
  }

  return appSettingsSchema.parse(merged);
}

export async function setAppSetting(
  key: AppSettingsKey,
  value: AppSettings[AppSettingsKey],
  userId: string,
) {
  await db
    .insert(appSettings)
    .values({
      key,
      value,
      updatedByUserId: userId,
      updatedAt: new Date(),
    })
    .onConflictDoUpdate({
      target: appSettings.key,
      set: {
        value,
        updatedByUserId: userId,
        updatedAt: new Date(),
      },
    });
}

export async function setAppSettings(values: AppSettings, userId: string) {
  const parsed = appSettingsSchema.parse(values);

  for (const [key, value] of Object.entries(parsed) as Array<
    [AppSettingsKey, AppSettings[AppSettingsKey]]
  >) {
    await setAppSetting(key, value, userId);
  }
}
