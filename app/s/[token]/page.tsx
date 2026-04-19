/* eslint-disable @next/next/no-img-element */
import type { Metadata } from "next";
import Link from "next/link";
import { and, eq, gt, isNull, or } from "drizzle-orm";
import { Download, Eye, ShieldAlert } from "lucide-react";
import { db } from "@/lib/db/client";
import { files, shareLinks } from "@/lib/db/schema";
import { getCurrentFileVersion } from "@/lib/drive";
import { hashValue } from "@/lib/ids";
import { createDownloadUrl } from "@/lib/storage";

export const metadata: Metadata = {
  title: "Shared Resource",
  description: "Public share link surface for view-only and download-enabled resources.",
};

export default async function PublicSharePage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const tokenHash = hashValue(token);

  const [share] = await db
    .select({
      id: shareLinks.id,
      fileId: shareLinks.resourceId,
      mode: shareLinks.mode,
      expiresAt: shareLinks.expiresAt,
      isRevoked: shareLinks.isRevoked,
      fileName: files.displayName,
      mimeType: files.mimeType,
      isDeleted: files.isDeleted,
      status: files.status,
    })
    .from(shareLinks)
    .leftJoin(files, eq(shareLinks.resourceId, files.id))
    .where(
      and(
        eq(shareLinks.tokenHash, tokenHash),
        eq(shareLinks.resourceType, "file"),
        eq(shareLinks.isRevoked, false),
        or(isNull(shareLinks.expiresAt), gt(shareLinks.expiresAt, new Date())),
      ),
    )
    .limit(1);

  if (!share || !share.fileId || share.isDeleted || share.status !== "ready") {
    return (
      <main className="flex min-h-screen items-center justify-center px-6 py-16">
        <div className="w-full max-w-xl rounded-[2rem] border border-ink-200/80 bg-white/82 p-8 shadow-[0_24px_80px_-48px_rgba(15,23,42,0.55)] backdrop-blur">
          <p className="font-mono text-sm text-ink-500">Invalid link</p>
          <h1 className="mt-3 text-4xl font-semibold tracking-[-0.05em] text-ink-950">
            This share link is unavailable.
          </h1>
          <p className="mt-3 text-base leading-8 text-ink-700">
            It may be expired, revoked, or linked to a deleted file.
          </p>
        </div>
      </main>
    );
  }

  const version = await getCurrentFileVersion(share.fileId);
  const downloadUrl = version ? await createDownloadUrl(version.storageKey) : null;
  const previewable = Boolean(
    downloadUrl &&
      (share.mimeType?.startsWith("image/") || share.mimeType === "application/pdf"),
  );

  return (
    <main className="flex min-h-screen items-center justify-center px-6 py-16">
      <div className="w-full max-w-3xl rounded-[2rem] border border-ink-200/80 bg-white/82 p-8 shadow-[0_24px_80px_-48px_rgba(15,23,42,0.55)] backdrop-blur">
        <div className="flex flex-col gap-8 md:flex-row md:items-start md:justify-between">
          <div className="max-w-xl space-y-4">
            <p className="font-mono text-sm text-ink-500">Shared file</p>
            <h1 className="text-4xl font-semibold tracking-[-0.05em] text-ink-950">
              {share.fileName}
            </h1>
            <p className="text-base leading-8 text-ink-700">
              This link is validated against a hashed token, revocation state,
              expiry, and the current file record before access is granted.
            </p>
          </div>

          <div className="rounded-[1.5rem] border border-emerald-700/20 bg-emerald-700/8 p-5 text-sm text-emerald-900">
            <p className="flex items-center gap-2 font-medium">
              <ShieldAlert className="h-4 w-4" />
              Shared-link policy
            </p>
            <p className="mt-2 leading-7">
              Deleted, expired, or revoked resources should fail closed and
              never expose permanent storage URLs.
            </p>
          </div>
        </div>

        <div className="mt-8 grid gap-4 border-t border-ink-200/80 pt-8 md:grid-cols-2">
          <div className="rounded-[1.5rem] border border-ink-200/80 bg-surface-strong p-5">
            <p className="flex items-center gap-2 font-medium text-ink-950">
              <Eye className="h-4 w-4 text-emerald-700" />
              View-only mode
            </p>
            <p className="mt-3 text-sm leading-7 text-ink-600">
              {share.mode === "view"
                ? "This link is currently limited to preview access."
                : "Preview access is available alongside downloads."}
            </p>
          </div>
          <div className="rounded-[1.5rem] border border-ink-200/80 bg-surface-strong p-5">
            <p className="flex items-center gap-2 font-medium text-ink-950">
              <Download className="h-4 w-4 text-emerald-700" />
              Download-enabled mode
            </p>
            <p className="mt-3 text-sm leading-7 text-ink-600">
              {share.mode === "download"
                ? "This link can issue a short-lived signed download URL."
                : "Downloads are disabled for this share link."}
            </p>
          </div>
        </div>

        {previewable ? (
          <div className="mt-8 overflow-hidden rounded-[1.5rem] border border-ink-200/80 bg-surface-strong p-3">
            {share.mimeType === "application/pdf" ? (
              <iframe
                src={downloadUrl ?? undefined}
                className="h-[36rem] w-full rounded-[1rem] bg-white"
                title={share.fileName ?? "Shared PDF"}
              />
            ) : (
              <img
                src={downloadUrl ?? undefined}
                alt={share.fileName ?? "Shared file preview"}
                className="max-h-[36rem] w-full rounded-[1rem] object-contain"
              />
            )}
          </div>
        ) : null}

        <div className="mt-8 flex gap-3">
          {downloadUrl && share.mode === "download" ? (
            <a
              href={downloadUrl}
              className="rounded-full bg-ink-950 px-5 py-3 text-sm font-medium text-white transition hover:bg-ink-800"
            >
              Download file
            </a>
          ) : null}
          <Link
            href="/"
            className="rounded-full border border-ink-300 px-5 py-3 text-sm font-medium text-ink-800 transition hover:border-ink-500 hover:bg-white"
          >
            Return home
          </Link>
        </div>
      </div>
    </main>
  );
}
