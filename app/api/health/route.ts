import { NextResponse } from "next/server";
import { env, readiness } from "@/lib/env";
import { siteConfig } from "@/lib/site";

export const dynamic = "force-dynamic";

export function GET() {
  return NextResponse.json(
    {
      status: "ok",
      service: siteConfig.name,
      timestamp: new Date().toISOString(),
      config: {
        appUrl: env.appBaseUrl,
        maxUploadSizeBytes: env.maxUploadSizeBytes,
        defaultSoftDeleteRetentionDays: env.defaultSoftDeleteRetentionDays,
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
