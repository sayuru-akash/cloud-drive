import { NextResponse } from "next/server";
import { getAppSettings } from "@/lib/app-settings";
import { env, readiness } from "@/lib/env";
import { siteConfig } from "@/lib/site";

export const dynamic = "force-dynamic";

export async function GET() {
  const settings = await getAppSettings();

  return NextResponse.json(
    {
      status: "ok",
      service: siteConfig.name,
      timestamp: new Date().toISOString(),
      config: {
        appUrl: env.appBaseUrl,
        maxUploadSizeBytes: settings.maxUploadSizeBytes,
        defaultSoftDeleteRetentionDays: settings.defaultSoftDeleteRetentionDays,
        defaultShareExpiryDays: settings.defaultShareExpiryDays,
      },
      readiness,
    },
    {
      headers: {
        "Cache-Control": "no-store",
      },
    },
  );
}
