import type { Metadata } from "next";
import { Activity, Link2, ShieldCheck, Trash2, Upload } from "lucide-react";
import {
  activityFeed,
  deletedItems,
  fileRows,
  shareLinks,
  summaryStats,
} from "@/lib/mock-data";

export const metadata: Metadata = {
  title: "Dashboard",
};

const statIcons = [Upload, Link2, Trash2, ShieldCheck];

export default function DashboardPage() {
  return (
    <main className="space-y-6">
      <section className="overflow-hidden rounded-[2rem] border border-ink-200/80 bg-[linear-gradient(135deg,rgba(255,255,255,0.88),rgba(247,243,236,0.72))] p-8 shadow-[0_24px_80px_-48px_rgba(15,23,42,0.55)] backdrop-blur">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="space-y-3">
            <p className="text-sm uppercase tracking-[0.24em] text-emerald-700">
              Workspace overview
            </p>
            <h1 className="text-4xl font-semibold tracking-[-0.05em] text-ink-950">
              Storage, sharing, and recovery in one operating surface.
            </h1>
            <p className="max-w-2xl text-base leading-8 text-ink-700">
              This shell is tuned for the file-system flows in the product spec:
              upload state, controlled link sharing, deleted-item recovery, and
              admin visibility.
            </p>
          </div>
          <div className="inline-flex items-center gap-2 rounded-full border border-emerald-700/20 bg-emerald-700/8 px-4 py-2 text-sm font-medium text-emerald-800">
            <Activity className="h-4 w-4" />
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

      <section className="grid gap-6 xl:grid-cols-[minmax(0,1.2fr)_minmax(0,0.8fr)]">
        <article className="rounded-[2rem] border border-ink-200/80 bg-white/80 p-6 shadow-[0_24px_80px_-52px_rgba(15,23,42,0.52)] backdrop-blur">
          <div className="mb-5 flex items-end justify-between gap-4">
            <div>
              <p className="text-sm uppercase tracking-[0.24em] text-ink-500">
                Recent files
              </p>
              <h2 className="mt-2 text-2xl font-semibold tracking-[-0.04em] text-ink-950">
                Files visible to the current user
              </h2>
            </div>
            <p className="text-sm text-ink-500">Sorted by modified date</p>
          </div>
          <div className="overflow-hidden rounded-[1.5rem] border border-ink-200/80">
            <div className="grid grid-cols-[minmax(0,1.4fr)_0.8fr_0.8fr_0.8fr] gap-4 bg-ink-950 px-5 py-3 text-xs uppercase tracking-[0.18em] text-white/70">
              <span>Name</span>
              <span>Owner</span>
              <span>Visibility</span>
              <span>Modified</span>
            </div>
            {fileRows.map((file) => (
              <div
                key={file.name}
                className="grid grid-cols-[minmax(0,1.4fr)_0.8fr_0.8fr_0.8fr] gap-4 border-t border-ink-200/80 bg-white px-5 py-4 text-sm text-ink-700"
              >
                <div className="min-w-0">
                  <p className="truncate font-medium text-ink-950">{file.name}</p>
                  <p className="mt-1 text-xs text-ink-500">
                    {file.type} • {file.size}
                  </p>
                </div>
                <span>{file.owner}</span>
                <span>{file.visibility}</span>
                <span>{file.modified}</span>
              </div>
            ))}
          </div>
        </article>

        <div className="grid gap-6">
          <article className="rounded-[2rem] border border-ink-200/80 bg-white/80 p-6 shadow-[0_24px_80px_-52px_rgba(15,23,42,0.52)] backdrop-blur">
            <p className="text-sm uppercase tracking-[0.24em] text-ink-500">
              Active links
            </p>
            <div className="mt-4 space-y-4">
              {shareLinks.map((link) => (
                <div key={link.name} className="border-t border-ink-200/80 pt-4 first:border-none first:pt-0">
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <p className="font-medium text-ink-950">{link.name}</p>
                      <p className="text-sm text-ink-600">{link.mode}</p>
                    </div>
                    <span className="rounded-full bg-emerald-700/10 px-3 py-1 text-xs font-medium text-emerald-800">
                      {link.expires}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </article>

          <article className="rounded-[2rem] border border-ink-200/80 bg-white/80 p-6 shadow-[0_24px_80px_-52px_rgba(15,23,42,0.52)] backdrop-blur">
            <p className="text-sm uppercase tracking-[0.24em] text-ink-500">
              Recovery queue
            </p>
            <div className="mt-4 space-y-4">
              {deletedItems.map((item) => (
                <div key={item.name} className="border-t border-ink-200/80 pt-4 first:border-none first:pt-0">
                  <p className="font-medium text-ink-950">{item.name}</p>
                  <p className="text-sm text-ink-600">
                    Deleted {item.deletedAt} • Restorable for {item.remaining}
                  </p>
                </div>
              ))}
            </div>
          </article>
        </div>
      </section>

      <section className="rounded-[2rem] border border-ink-200/80 bg-white/78 p-6 shadow-[0_24px_80px_-52px_rgba(15,23,42,0.52)] backdrop-blur">
        <p className="text-sm uppercase tracking-[0.24em] text-ink-500">
          Audit activity
        </p>
        <div className="mt-5 grid gap-4 md:grid-cols-3">
          {activityFeed.map((event) => (
            <article key={event.title} className="border-t border-ink-200/80 pt-4">
              <p className="font-medium text-ink-950">{event.title}</p>
              <p className="mt-2 text-sm leading-7 text-ink-600">{event.detail}</p>
              <p className="mt-3 font-mono text-xs text-ink-500">{event.when}</p>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}
