/* eslint-disable @next/next/no-img-element */
import type { Metadata } from "next";
import Link from "next/link";
import { Download, Eye, ShieldAlert } from "lucide-react";
import { getActivePublicShareByToken } from "@/lib/shares";

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
  const share = await getActivePublicShareByToken(token);

  if (!share) {
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

  const previewUrl = share.previewable
    ? `/api/public-share/${token}/preview`
    : null;
  const downloadUrl = share.mode === "download"
    ? `/api/public-share/${token}/download`
    : null;

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
              View-only links are streamed through the app so the browser can
              preview supported files without exposing a reusable object URL.
            </p>
          </div>

          <div className="rounded-[1.5rem] border border-emerald-700/20 bg-emerald-700/8 p-5 text-sm text-emerald-900">
            <p className="flex items-center gap-2 font-medium">
              <ShieldAlert className="h-4 w-4" />
              Shared-link policy
            </p>
            <p className="mt-2 leading-7">
              Deleted, expired, or revoked resources fail closed. Downloads stay
              disabled unless the link was created in download mode.
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
                ? "Preview is available where the file type supports it, but direct download is disabled."
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
                ? "This link can issue a short-lived download redirect after server-side validation."
                : "Downloads are disabled for this share link."}
            </p>
          </div>
        </div>

        {previewUrl ? (
          <div className="mt-8 overflow-hidden rounded-[1.5rem] border border-ink-200/80 bg-surface-strong p-3">
            {share.mimeType === "application/pdf" ? (
              <iframe
                src={previewUrl}
                className="h-[36rem] w-full rounded-[1rem] bg-white"
                title={share.fileName ?? "Shared PDF"}
              />
            ) : (
              <img
                src={previewUrl}
                alt={share.fileName ?? "Shared file preview"}
                className="max-h-[36rem] w-full rounded-[1rem] object-contain"
              />
            )}
          </div>
        ) : null}

        <div className="mt-8 flex gap-3">
          {downloadUrl ? (
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
