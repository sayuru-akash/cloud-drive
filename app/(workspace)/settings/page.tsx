import type { Metadata } from "next";
import { env, readiness } from "@/lib/env";

export const metadata: Metadata = {
  title: "Settings",
};

const settingsRows = [
  {
    title: "Upload limits",
    detail: `${env.maxUploadSizeBytes.toLocaleString()} bytes max upload size.`,
  },
  {
    title: "Retention policy",
    detail: `${env.defaultSoftDeleteRetentionDays} day default soft-delete retention.`,
  },
  {
    title: "Storage bucket",
    detail: env.b2BucketName,
  },
];

export default function SettingsPage() {
  return (
    <main className="space-y-6">
      <section className="rounded-[2rem] border border-ink-200/80 bg-white/80 p-8 shadow-[0_24px_80px_-52px_rgba(15,23,42,0.52)] backdrop-blur">
        <p className="text-sm uppercase tracking-[0.24em] text-ink-500">
          Settings
        </p>
        <h1 className="mt-3 text-4xl font-semibold tracking-[-0.05em] text-ink-950">
          Runtime configuration and readiness.
        </h1>
        <p className="mt-3 max-w-2xl text-base leading-8 text-ink-700">
          Email remains optional for now. Auth, database, and storage are the
          critical paths for the current release.
        </p>
      </section>

      <section className="grid gap-6 md:grid-cols-3">
        {settingsRows.map((item) => (
          <article
            key={item.title}
            className="rounded-[2rem] border border-ink-200/80 bg-white/80 p-6 shadow-[0_24px_80px_-52px_rgba(15,23,42,0.52)] backdrop-blur"
          >
            <p className="font-medium text-ink-950">{item.title}</p>
            <p className="mt-3 text-sm leading-7 text-ink-600">{item.detail}</p>
          </article>
        ))}
      </section>

      <section className="rounded-[2rem] border border-ink-200/80 bg-white/80 p-6 shadow-[0_24px_80px_-52px_rgba(15,23,42,0.52)] backdrop-blur">
        <p className="text-sm uppercase tracking-[0.24em] text-ink-500">
          Readiness
        </p>
        <div className="mt-5 grid gap-4 md:grid-cols-4">
          {Object.entries(readiness).map(([key, value]) => (
            <article key={key} className="rounded-[1.5rem] border border-ink-200/80 bg-surface-strong p-4">
              <p className="text-sm font-medium capitalize text-ink-950">
                {key.replace(/([A-Z])/g, " $1")}
              </p>
              <p className={`mt-3 text-sm ${value ? "text-emerald-700" : "text-amber-700"}`}>
                {value ? "Configured" : "Pending"}
              </p>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}
