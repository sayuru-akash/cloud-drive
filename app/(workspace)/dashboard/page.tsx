import type { Metadata } from "next";
import { Link2, ShieldCheck, Trash2, Upload } from "lucide-react";
import { requireSession } from "@/lib/auth/session";
import { getDashboardData } from "@/lib/drive";

export const metadata: Metadata = {
  title: "Dashboard",
};

const statIcons = [Upload, Link2, Trash2, ShieldCheck];

export default async function DashboardPage() {
  const session = await requireSession();
  const data = await getDashboardData(session.user.id, session.user.role);

  const summaryStats = [
    {
      label: "Pending uploads",
      value: String(data.summary.pendingUploads),
      detail: "Waiting for browser completion or verification",
    },
    {
      label: "Active links",
      value: String(data.summary.activeLinks),
      detail: "Non-revoked share links",
    },
    {
      label: "Deleted files",
      value: String(data.summary.deletedFiles),
      detail: "Recoverable through deleted items",
    },
    {
      label: "Workspace-visible files",
      value: String(data.summary.workspaceFiles),
      detail: "Accessible to authenticated users",
    },
  ];

  return (
    <main className="space-y-6">
      <section className="overflow-hidden rounded-[2rem] border border-ink-200/80 bg-[linear-gradient(135deg,rgba(255,255,255,0.88),rgba(247,243,236,0.72))] p-8 shadow-[0_24px_80px_-48px_rgba(15,23,42,0.55)] backdrop-blur">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="space-y-3">
            <p className="text-sm uppercase tracking-[0.24em] text-emerald-700">
              Workspace overview
            </p>
            <h1 className="text-4xl font-semibold tracking-[-0.05em] text-ink-950">
              Welcome back, {session.user.name}.
            </h1>
            <p className="max-w-2xl text-base leading-8 text-ink-700">
              This workspace is now backed by Neon, Better Auth, and signed
              Backblaze uploads. The current session role is `{session.user.role}`.
            </p>
          </div>
          <div className="inline-flex items-center gap-2 rounded-full border border-emerald-700/20 bg-emerald-700/8 px-4 py-2 text-sm font-medium text-emerald-800">
            <ShieldCheck className="h-4 w-4" />
            Health endpoint available at `/api/health`
          </div>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {summaryStats.map((stat, index) => {
          const Icon = statIcons[index];

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
              <p className="mt-2 text-sm text-ink-600">{stat.detail}</p>
            </article>
          );
        })}
      </section>

      <section className="rounded-[2rem] border border-ink-200/80 bg-white/80 p-6 shadow-[0_24px_80px_-52px_rgba(15,23,42,0.52)] backdrop-blur">
        <div className="mb-5 flex items-end justify-between gap-4">
          <div>
            <p className="text-sm uppercase tracking-[0.24em] text-ink-500">
              Latest uploads
            </p>
            <h2 className="mt-2 text-2xl font-semibold tracking-[-0.04em] text-ink-950">
              Freshly verified files
            </h2>
          </div>
          <p className="text-sm text-ink-500">Newest first</p>
        </div>

        {data.recentUploads.length === 0 ? (
          <p className="text-sm leading-7 text-ink-600">
            No ready files yet. Head to the Files page to create a folder and
            upload the first document.
          </p>
        ) : (
          <div className="overflow-hidden rounded-[1.5rem] border border-ink-200/80">
            <div className="grid grid-cols-[minmax(0,1.4fr)_0.8fr_0.7fr] gap-4 bg-ink-950 px-5 py-3 text-xs uppercase tracking-[0.18em] text-white/70">
              <span>Name</span>
              <span>Owner</span>
              <span>Modified</span>
            </div>
            {data.recentUploads.map((file) => (
              <div
                key={file.id}
                className="grid grid-cols-[minmax(0,1.4fr)_0.8fr_0.7fr] gap-4 border-t border-ink-200/80 bg-white px-5 py-4 text-sm text-ink-700"
              >
                <div className="min-w-0">
                  <p className="truncate font-medium text-ink-950">{file.name}</p>
                  <p className="mt-1 text-xs text-ink-500">
                    {file.mimeType} • {Number(file.sizeBytes).toLocaleString()} bytes
                  </p>
                </div>
                <span>{file.ownerName ?? "Unknown"}</span>
                <span>{new Date(file.updatedAt).toLocaleString()}</span>
              </div>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
