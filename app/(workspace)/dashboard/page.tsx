import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowRight,
  Download,
  FileText,
  FolderOpen,
  Link2,
  Trash2,
  Upload,
} from "lucide-react";
import { requireSession } from "@/lib/auth/session";
import { getDashboardData } from "@/lib/drive";
import { formatBytes, formatDate } from "@/lib/format";
import { FileIcon } from "@/components/file-icon";
import { UploadActivityCard } from "@/components/upload-activity-card";

export const metadata: Metadata = {
  title: "Dashboard",
};

export default async function DashboardPage() {
  const session = await requireSession();
  const data = await getDashboardData(session.user.id, session.user.role);

  return (
    <main className="space-y-6">
      {/* Welcome */}
      <section className="overflow-hidden rounded-[2rem] border border-ink-200/80 bg-[linear-gradient(135deg,rgba(255,255,255,0.88),rgba(247,243,236,0.72))] p-6 shadow-[0_24px_80px_-48px_rgba(15,23,42,0.55)] backdrop-blur md:p-8">
        <h1 className="text-3xl font-semibold tracking-[-0.05em] text-ink-950 sm:text-4xl">
          Welcome back, {session.user.name}.
        </h1>
        <p className="mt-3 max-w-2xl text-lg leading-8 text-ink-700">
          Here&apos;s what&apos;s happening in your workspace.
        </p>
      </section>

      {/* Stats */}
      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Link
          href="/files"
          className="group rounded-[1.5rem] border border-ink-200/80 bg-white/78 p-5 shadow-[0_20px_70px_-48px_rgba(15,23,42,0.5)] backdrop-blur transition hover:border-emerald-300 hover:bg-white"
        >
          <div className="flex items-center justify-between">
            <p className="text-sm text-ink-600">Total files</p>
            <FileText className="h-4 w-4 text-emerald-700 transition group-hover:scale-110" />
          </div>
          <p className="mt-5 text-3xl font-semibold tracking-[-0.05em] text-ink-950">
            {data.summary.workspaceFiles}
          </p>
          <div className="mt-3 flex items-center gap-1 text-xs font-medium text-emerald-800 opacity-0 transition group-hover:opacity-100">
            Open <ArrowRight className="h-3 w-3" />
          </div>
        </Link>

        <Link
          href="/shared"
          className="group rounded-[1.5rem] border border-ink-200/80 bg-white/78 p-5 shadow-[0_20px_70px_-48px_rgba(15,23,42,0.5)] backdrop-blur transition hover:border-emerald-300 hover:bg-white"
        >
          <div className="flex items-center justify-between">
            <p className="text-sm text-ink-600">Active links</p>
            <Link2 className="h-4 w-4 text-emerald-700 transition group-hover:scale-110" />
          </div>
          <p className="mt-5 text-3xl font-semibold tracking-[-0.05em] text-ink-950">
            {data.summary.activeLinks}
          </p>
          <div className="mt-3 flex items-center gap-1 text-xs font-medium text-emerald-800 opacity-0 transition group-hover:opacity-100">
            Open <ArrowRight className="h-3 w-3" />
          </div>
        </Link>

        <Link
          href="/deleted"
          className="group rounded-[1.5rem] border border-ink-200/80 bg-white/78 p-5 shadow-[0_20px_70px_-48px_rgba(15,23,42,0.5)] backdrop-blur transition hover:border-emerald-300 hover:bg-white"
        >
          <div className="flex items-center justify-between">
            <p className="text-sm text-ink-600">In trash</p>
            <Trash2 className="h-4 w-4 text-emerald-700 transition group-hover:scale-110" />
          </div>
          <p className="mt-5 text-3xl font-semibold tracking-[-0.05em] text-ink-950">
            {data.summary.deletedFiles}
          </p>
          <div className="mt-3 flex items-center gap-1 text-xs font-medium text-emerald-800 opacity-0 transition group-hover:opacity-100">
            Open <ArrowRight className="h-3 w-3" />
          </div>
        </Link>

        <Link
          href="/files"
          className="group rounded-[1.5rem] border border-ink-200/80 bg-white/78 p-5 shadow-[0_20px_70px_-48px_rgba(15,23,42,0.5)] backdrop-blur transition hover:border-emerald-300 hover:bg-white"
        >
          <div className="flex items-center justify-between">
            <p className="text-sm text-ink-600">Pending uploads</p>
            <Upload className="h-4 w-4 text-emerald-700 transition group-hover:scale-110" />
          </div>
          <p className="mt-5 text-3xl font-semibold tracking-[-0.05em] text-ink-950">
            {data.summary.pendingUploads}
          </p>
          <div className="mt-3 flex items-center gap-1 text-xs font-medium text-emerald-800 opacity-0 transition group-hover:opacity-100">
            Open <ArrowRight className="h-3 w-3" />
          </div>
        </Link>
      </section>

      {data.pendingUploads.length > 0 ? (
        <UploadActivityCard
          id="upload-activity"
          uploads={data.pendingUploads}
          total={data.summary.pendingUploads}
          linkToFiles
        />
      ) : null}

      {/* Recent files */}
      <section className="rounded-[2rem] border border-ink-200/80 bg-white/80 p-5 shadow-[0_24px_80px_-52px_rgba(15,23,42,0.52)] backdrop-blur sm:p-6">
        <div className="mb-5 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between sm:gap-4">
          <div>
            <p className="text-sm uppercase tracking-[0.24em] text-ink-500">
              Recent files
            </p>
            <h2 className="mt-2 text-2xl font-semibold tracking-[-0.04em] text-ink-950">
              Latest uploads
            </h2>
          </div>
          <Link
            href="/files"
            className="text-sm font-medium text-emerald-800 transition hover:text-emerald-700"
          >
            View all files →
          </Link>
        </div>

        {data.recentUploads.length === 0 ? (
          <div className="py-10 text-center">
            <p className="text-lg font-medium text-ink-950">No files yet</p>
            <p className="mt-2 text-sm text-ink-600">
              Head to{" "}
              <Link
                href="/files"
                className="text-emerald-800 underline underline-offset-4"
              >
                Files
              </Link>{" "}
              to upload your first document.
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {data.recentUploads.map((file) => (
              <div
                key={file.id}
                className="group flex items-center gap-4 rounded-[1.25rem] border border-ink-200/60 bg-white/70 px-4 py-3 transition hover:border-ink-300 hover:bg-white"
              >
                <FileIcon
                  mimeType={file.mimeType}
                  className="h-5 w-5 shrink-0 text-ink-500"
                />
                <div className="min-w-0 flex-1">
                  <a
                    href={`/api/files/${file.id}/download`}
                    target="_blank"
                    rel="noreferrer"
                    className="truncate font-medium text-ink-950 underline-offset-4 hover:underline"
                  >
                    {file.name}
                  </a>
                  <p className="mt-0.5 flex flex-wrap items-center gap-x-2 text-xs text-ink-500">
                    <span>{formatBytes(file.sizeBytes)}</span>
                    {file.folderId && file.folderName ? (
                      <Link
                        href={`/files?folder=${file.folderId}`}
                        className="inline-flex items-center gap-1 text-emerald-800 transition hover:underline"
                      >
                        <FolderOpen className="h-3 w-3" />
                        {file.folderName}
                      </Link>
                    ) : (
                      <span className="text-ink-400">Root</span>
                    )}
                  </p>
                </div>
                <span className="hidden text-sm text-ink-500 sm:block">
                  {formatDate(file.updatedAt)}
                </span>
                <a
                  href={`/api/files/${file.id}/download`}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex rounded-full border border-ink-300 p-2 text-ink-700 transition hover:border-emerald-400 hover:bg-emerald-50 hover:text-emerald-800"
                  aria-label={`Download ${file.name}`}
                >
                  <Download className="h-4 w-4" />
                </a>
              </div>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
