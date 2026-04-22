import type { Metadata } from "next";
import Link from "next/link";
import { FileText, Link2, Trash2, Upload } from "lucide-react";
import { requireSession } from "@/lib/auth/session";
import { getDashboardData } from "@/lib/drive";
import { formatBytes, formatDate } from "@/lib/format";
import { FileIcon } from "@/components/file-icon";

export const metadata: Metadata = {
  title: "Dashboard",
};

export default async function DashboardPage() {
  const session = await requireSession();
  const data = await getDashboardData(session.user.id, session.user.role);

  const stats = [
    {
      label: "Total files",
      value: String(data.summary.workspaceFiles),
      icon: FileText,
    },
    {
      label: "Active links",
      value: String(data.summary.activeLinks),
      icon: Link2,
    },
    {
      label: "In trash",
      value: String(data.summary.deletedFiles),
      icon: Trash2,
    },
    {
      label: "Pending uploads",
      value: String(data.summary.pendingUploads),
      icon: Upload,
    },
  ];

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
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <article
              key={stat.label}
              className="rounded-[1.5rem] border border-ink-200/80 bg-white/78 p-5 shadow-[0_20px_70px_-48px_rgba(15,23,42,0.5)] backdrop-blur"
            >
              <div className="flex items-center justify-between">
                <p className="text-sm text-ink-600">{stat.label}</p>
                <Icon className="h-4 w-4 text-emerald-700" />
              </div>
              <p className="mt-5 text-3xl font-semibold tracking-[-0.05em] text-ink-950">
                {stat.value}
              </p>
            </article>
          );
        })}
      </section>

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
          <p className="text-sm leading-7 text-ink-600">
            No files yet. Head to <Link href="/files" className="text-emerald-800 underline">Files</Link> to upload your first document.
          </p>
        ) : (
          <div className="space-y-2">
            {data.recentUploads.map((file) => (
              <div
                key={file.id}
                className="flex items-center gap-4 rounded-[1.25rem] border border-ink-200/60 bg-white/70 px-4 py-3"
              >
                <FileIcon mimeType={file.mimeType} className="h-5 w-5 text-ink-500" />
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium text-ink-950">{file.name}</p>
                  <p className="text-xs text-ink-500">
                    {formatBytes(file.sizeBytes)} • {file.ownerName ?? "You"}
                  </p>
                </div>
                <span className="hidden text-sm text-ink-500 sm:block">
                  {formatDate(file.updatedAt)}
                </span>
              </div>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
